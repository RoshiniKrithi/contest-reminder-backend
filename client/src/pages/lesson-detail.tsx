import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Play,
    FileText,
    CheckCircle2,
    Clock,
    Layout,
    BookOpen,
    Sword,
    Target,
    Trophy,
    ShieldCheck,
    RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Course, Lesson, Enrollment, LessonProgress } from "@shared/schema";
import ParticlesBackground from "@/components/layout/particles-background";
import PageTransition from "@/components/layout/page-transition";

export default function LessonDetail() {
    const { id: courseId, lessonId } = useParams();
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizCorrect, setQuizCorrect] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);

    // Queries
    const { data: course } = useQuery<Course>({
        queryKey: ["/api/courses", courseId],
    });

    const { data: lessons = [] } = useQuery<Lesson[]>({
        queryKey: ["/api/courses", courseId, "lessons"],
    });

    const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson>({
        queryKey: ["/api/lessons", lessonId],
    });

    const { data: enrollment } = useQuery<Enrollment>({
        queryKey: ["/api/users", user?.id, "courses", courseId, "enrollment"],
        enabled: !!user && !!courseId,
    });

    const { data: progress } = useQuery<LessonProgress>({
        queryKey: ["/api/users", user?.id, "lessons", lessonId, "progress"],
        enabled: !!user && !!lessonId,
    });

    useEffect(() => {
        setShowQuiz(false);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setQuizSubmitted(false);
    }, [lessonId]);

    // Mutations
    const completeMutation = useMutation({
        mutationFn: async ({ completed }: { completed: boolean }) => {
            if (!enrollment) return;
            return await apiRequest(
                "PATCH",
                `/api/enrollments/${enrollment.id}/lessons/${lessonId}/progress`,
                { userId: user?.id, completed, timeSpent: lesson?.duration || 5 }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "lessons", lessonId, "progress"] });
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments", enrollment?.id, "progress"] });
            toast({
                title: "Mission Accomplished",
                description: "Your progress has been encrypted and saved to the central database.",
            });
        }
    });

    const currentLessonIndex = lessons.findIndex((l) => l.id === lessonId);
    const nextLesson = lessons[currentLessonIndex + 1];
    const prevLesson = lessons[currentLessonIndex - 1];

    const handleQuizSubmit = () => {
        if (selectedOption === null || !lesson?.quizData) return;

        const currentQuiz = (lesson.quizData as any)[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuiz.correctAnswerIndex;

        setQuizCorrect(isCorrect);
        setQuizSubmitted(true);

        if (isCorrect) {
            if (currentQuestionIndex === (lesson.quizData as any).length - 1) {
                completeMutation.mutate({ completed: true });
            }
        } else {
            toast({
                title: "Extraction Failed",
                description: "Your logic was flawed. Review the briefing and try again.",
                variant: "destructive",
            });
        }
    };

    const nextQuestion = () => {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setQuizSubmitted(false);
    };

    if (lessonLoading || !lesson) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-blue-500 font-black uppercase tracking-widest text-[10px]">Establishing Uplink...</p>
                </div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
                <ParticlesBackground />

                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                    <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/course/${courseId}`}>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-slate-400 hover:text-white">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="h-4 w-px bg-white/10 hidden sm:block" />
                            <div>
                                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest hidden sm:block">
                                    {course?.title || "Tactical Module"}
                                </h2>
                                <h1 className="text-sm font-bold text-white leading-tight truncate max-w-[200px] sm:max-w-md">
                                    {lesson.title}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="hidden md:flex rounded-full bg-blue-500/10 border-blue-500/20 text-blue-400 font-black uppercase text-[10px] tracking-widest py-1 px-3">
                                {lesson.type} Protocol
                            </Badge>
                            {progress?.completed && (
                                <Badge className="rounded-full bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-black uppercase text-[10px] tracking-widest py-1 px-3">
                                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                    Clear
                                </Badge>
                            )}
                        </div>
                    </div>
                </header>

                <main className="container max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Primary Content Area */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Media Section */}
                            <div className="aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl relative group">
                                {lesson.videoUrl && !showQuiz ? (
                                    <iframe
                                        src={lesson.videoUrl}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (lesson.quizData && (lesson.quizData as any).length > 0) ? (
                                    <div className="w-full h-full bg-slate-900/50 backdrop-blur-xl overflow-y-auto custom-scrollbar">
                                        <div className="p-8 space-y-6 max-w-2xl mx-auto h-full flex flex-col justify-center">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                    The Extraction
                                                </h3>
                                                <span className="text-[10px] font-black text-slate-500">
                                                    QUESTION {currentQuestionIndex + 1} / {(lesson.quizData as any).length}
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-lg font-bold text-slate-200 leading-snug">
                                                    {(lesson.quizData as any)[currentQuestionIndex].question}
                                                </p>

                                                <div className="space-y-2">
                                                    {(lesson.quizData as any)[currentQuestionIndex].options.map((option: string, i: number) => (
                                                        <button
                                                            key={i}
                                                            disabled={quizSubmitted}
                                                            onClick={() => setSelectedOption(i)}
                                                            className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all border ${selectedOption === i
                                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                                : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5'
                                                                } ${quizSubmitted && i === (lesson.quizData as any)[currentQuestionIndex].correctAnswerIndex
                                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                                    : quizSubmitted && selectedOption === i && !quizCorrect
                                                                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                                                                        : ''
                                                                }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {!quizSubmitted ? (
                                                <div className="flex gap-4">
                                                    {lesson.videoUrl && (
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 border-white/10 hover:bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest h-14"
                                                            onClick={() => setShowQuiz(false)}
                                                        >
                                                            Back to Intel
                                                        </Button>
                                                    )}
                                                    <Button
                                                        className="flex-[2] bg-white text-slate-950 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest h-14"
                                                        disabled={selectedOption === null}
                                                        onClick={handleQuizSubmit}
                                                    >
                                                        Submit Response
                                                    </Button>
                                                </div>
                                            ) : quizCorrect ? (
                                                currentQuestionIndex < (lesson.quizData as any).length - 1 ? (
                                                    <Button
                                                        onClick={nextQuestion}
                                                        className="w-full bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl font-black uppercase text-xs tracking-widest h-14"
                                                    >
                                                        Next Question
                                                    </Button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                                                            <Trophy className="h-5 w-5 text-emerald-500" />
                                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Protocol Verified</span>
                                                        </div>
                                                        {nextLesson && (
                                                            <Button
                                                                onClick={() => setLocation(`/course/${courseId}/lesson/${nextLesson.id}`)}
                                                                className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black uppercase text-xs tracking-widest h-14"
                                                            >
                                                                Continue to Next Module
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            ) : (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedOption(null);
                                                        setQuizSubmitted(false);
                                                    }}
                                                    variant="outline"
                                                    className="w-full border-white/10 hover:bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest h-14"
                                                >
                                                    <RotateCcw className="h-3 w-3 mr-2" />
                                                    Retry Extraction
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900">
                                        <FileText className="h-16 w-16 text-slate-700 mb-6" />
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Technical Briefing</h3>
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <Button
                                    variant="ghost"
                                    disabled={!prevLesson}
                                    onClick={() => setLocation(`/course/${courseId}/lesson/${prevLesson?.id}`)}
                                    className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Prev Module
                                </Button>

                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1">
                                        {lessons.map((l, i) => (
                                            <div
                                                key={l.id}
                                                className={`w-1.5 h-1.5 rounded-full ${l.id === lessonId ? 'bg-blue-500 scale-125' : 'bg-slate-700'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    disabled={!nextLesson}
                                    onClick={() => setLocation(`/course/${courseId}/lesson/${nextLesson?.id}`)}
                                    className="rounded-xl font-black uppercase text-[10px] tracking-widest text-blue-500 hover:text-blue-400"
                                >
                                    Next Module
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>

                            {/* Lesson Description & Content */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Mission Intelligence</h2>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-slate-400 leading-relaxed font-medium">
                                        {lesson.content}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <AnimatePresence mode="wait">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-white/5 rounded-[2rem] p-8 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Layout className="h-5 w-5 text-blue-500" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocol Overview</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Estimated Time</span>
                                            <span className="text-xs font-bold text-white">{lesson.duration} Minutes</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Clearance Type</span>
                                            <span className="text-xs font-bold text-white">{lesson.type}</span>
                                        </div>
                                    </div>

                                    {!progress?.completed && (
                                        lesson.quizData && (lesson.quizData as any).length > 0 && !showQuiz ? (
                                            <Button
                                                onClick={() => setShowQuiz(true)}
                                                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black uppercase text-[10px] tracking-widest h-12"
                                            >
                                                <ShieldCheck className="w-4 h-4 mr-2" />
                                                Take Module Quiz
                                            </Button>
                                        ) : lesson.type !== 'quiz' && !showQuiz ? (
                                            <Button
                                                onClick={() => completeMutation.mutate({ completed: true })}
                                                disabled={completeMutation.isPending}
                                                className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black uppercase text-[10px] tracking-widest h-12"
                                            >
                                                Mark as Complete
                                            </Button>
                                        ) : null
                                    )}
                                </Card>
                            </AnimatePresence>

                            {/* Progress Summary */}
                            <Card className="bg-blue-500/5 border-blue-500/10 rounded-3xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <BookOpen className="h-4 w-4 text-blue-400" />
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Module Sequence</h4>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {lessons.map((l, i) => (
                                        <button
                                            key={l.id}
                                            onClick={() => setLocation(`/course/${courseId}/lesson/${l.id}`)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${l.id === lessonId
                                                ? 'bg-blue-500/20 border border-blue-500/50'
                                                : 'bg-white/5 border border-transparent hover:border-white/10'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${l.id === lessonId ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <span className={`text-[10px] font-bold text-left truncate ${l.id === lessonId ? 'text-white' : 'text-slate-500'
                                                }`}>
                                                {l.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
}
