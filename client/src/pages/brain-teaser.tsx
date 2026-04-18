import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Target, Lightbulb, Trophy, Flame, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { triggerConfetti } from "@/lib/confetti";
import { apiRequest } from "@/lib/queryClient";

interface BrainTeaser {
    id: string;
    date: string;
    title: string;
    puzzle: string;
    hint1?: string;
    hint2?: string;
    hint3?: string;
    solution: string;
    difficulty: string;
    explanation: string;
    category: string;
}

interface TeaserAttempt {
    solved: boolean;
    hintsUsed: number;
    attempts: number;
}

interface TeaserCalendar {
    date: string;
    solved: boolean;
}

export default function BrainTeaserPage() {
    const [answer, setAnswer] = useState("");
    const [hintsRevealed, setHintsRevealed] = useState(0);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: teaser } = useQuery<BrainTeaser>({
        queryKey: ["/api/challenges/brain-teaser/daily"],
    });

    const { data: attempt } = useQuery<TeaserAttempt>({
        queryKey: ["/api/challenges/brain-teaser/attempt", teaser?.id],
        enabled: !!teaser,
    });

    const { data: calendar } = useQuery<TeaserCalendar[]>({
        queryKey: ["/api/challenges/brain-teaser/calendar"],
    });

    const submitAnswer = useMutation({
        mutationFn: async (userAnswer: string) => {
            const res = await apiRequest("POST", "/api/challenges/brain-teaser/submit", { teaserId: teaser?.id, answer: userAnswer });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/brain-teaser/attempt"] });
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/brain-teaser/calendar"] });
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/stats"] });

            if (data.correct) {
                triggerConfetti.realistic();
                toast({
                    title: "Correct! 🎉",
                    description: "You solved today's brain teaser!",
                });
            } else {
                toast({
                    title: "Not quite!",
                    description: "Try again or use a hint.",
                    variant: "destructive",
                });
            }
        },
    });

    const revealHint = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/challenges/brain-teaser/hint", { teaserId: teaser?.id });
            return res.json();
        },
        onSuccess: () => {
            setHintsRevealed((prev) => Math.min(prev + 1, 3));
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/brain-teaser/attempt"] });
        },
    });

    const handleSubmit = () => {
        if (!answer.trim()) {
            toast({
                title: "Enter an answer",
                description: "Please type your answer before submitting.",
                variant: "destructive",
            });
            return;
        }
        submitAnswer.mutate(answer);
    };

    const getStreakCount = () => {
        if (!calendar) return 0;
        let streak = 0;
        const sorted = [...calendar].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const entry of sorted) {
            if (entry.solved) streak++;
            else break;
        }
        return streak;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "hard": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
        }
    };

    const hints = [teaser?.hint1, teaser?.hint2, teaser?.hint3].filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
        >
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/challenges">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Challenges
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                        <Flame className="h-5 w-5 text-orange-400" />
                        <span className="text-lg font-black text-orange-400">{getStreakCount()} Day Streak</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Puzzle Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                                            <Target className="h-6 w-6 text-orange-400" />
                                            {teaser?.title || "Loading..."}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getDifficultyColor(teaser?.difficulty || "")}>
                                                {teaser?.difficulty}
                                            </Badge>
                                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                                                {teaser?.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    {attempt?.solved && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                                            <span className="text-sm font-bold text-green-400">Solved</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Puzzle */}
                                <div className="p-6 bg-slate-900 rounded-lg border border-slate-700">
                                    <p className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
                                        {teaser?.puzzle}
                                    </p>
                                </div>

                                {/* Hints */}
                                {hints.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-slate-300">Hints Available</h3>
                                            <span className="text-xs text-slate-500">
                                                {attempt?.hintsUsed || 0} / {hints.length} used
                                            </span>
                                        </div>
                                        {hints.map((hint, idx) => (
                                            <div key={idx}>
                                                {hintsRevealed > idx || (attempt?.hintsUsed || 0) > idx ? (
                                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <Lightbulb className="h-5 w-5 text-yellow-400 mt-0.5" />
                                                            <div>
                                                                <div className="text-xs font-bold text-blue-400 mb-1">Hint {idx + 1}</div>
                                                                <p className="text-sm text-slate-300">{hint}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => revealHint.mutate()}
                                                        variant="outline"
                                                        className="w-full border-slate-600 text-slate-400"
                                                        disabled={hintsRevealed !== idx || attempt?.solved}
                                                    >
                                                        <Lightbulb className="h-4 w-4 mr-2" />
                                                        Reveal Hint {idx + 1}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Answer Input */}
                                {!attempt?.solved ? (
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-300">Your Answer</label>
                                        <div className="flex gap-3">
                                            <Input
                                                value={answer}
                                                onChange={(e) => setAnswer(e.target.value)}
                                                placeholder="Type your answer..."
                                                className="flex-1 bg-slate-900 border-slate-700 text-white"
                                                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                                            />
                                            <Button
                                                onClick={handleSubmit}
                                                className="bg-gradient-to-r from-orange-500 to-red-500 px-8"
                                                disabled={submitAnswer.isPending}
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                        {attempt && attempt.attempts > 0 && (
                                            <p className="text-sm text-slate-500">
                                                Attempts: {attempt.attempts}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                                        <div className="flex items-start gap-4">
                                            <Trophy className="h-12 w-12 text-yellow-400" />
                                            <div className="flex-1">
                                                <h3 className="text-xl font-black text-white mb-2">Congratulations! 🎉</h3>
                                                <p className="text-slate-300 mb-3">You solved today's brain teaser!</p>
                                                <div className="p-4 bg-slate-900/50 rounded-lg">
                                                    <div className="text-xs font-bold text-blue-400 mb-2">Solution Explanation</div>
                                                    <p className="text-sm text-slate-300">{teaser?.explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-orange-400" />
                                    Progress Calendar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-2">
                                    {calendar?.slice(0, 28).map((day, idx) => {
                                        const date = new Date(day.date);
                                        return (
                                            <div
                                                key={idx}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${day.solved
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                    : "bg-slate-900 text-slate-600 border border-slate-700"
                                                    }`}
                                            >
                                                {date.getDate()}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Total Solved</span>
                                        <span className="font-bold text-white">
                                            {calendar?.filter((d) => d.solved).length || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Current Streak</span>
                                        <span className="font-bold text-orange-400 flex items-center gap-1">
                                            <Flame className="h-4 w-4" />
                                            {getStreakCount()} days
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
