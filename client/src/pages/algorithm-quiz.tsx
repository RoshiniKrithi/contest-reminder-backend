import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Brain, Trophy, CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { triggerConfetti } from "@/lib/confetti";
import { apiRequest } from "@/lib/queryClient";

interface QuizQuestion {
    id: string;
    question: string;
    codeSnippet?: string;
    options: string[];
    correctAnswer: number;
    topic: string;
    difficulty: string;
    explanation: string;
    timeLimit: number;
}

export default function AlgorithmQuizPage() {
    const [, setLocation] = useLocation();
    const [topic, setTopic] = useState("arrays");
    const [difficulty, setDifficulty] = useState("medium");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: questions, refetch } = useQuery<QuizQuestion[]>({
        queryKey: ["/api/challenges/quiz/questions", { topic, difficulty, count: 2 }],
        enabled: quizStarted,
    });

    const submitQuiz = useMutation({
        mutationFn: async (data: {
            questionIds: string[];
            userAnswers: number[];
            score: number;
            totalQuestions: number;
            topic: string;
            timeSpent: number;
        }) => {
            const res = await apiRequest("POST", "/api/challenges/quiz/submit", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/stats"] });
            toast({
                title: "Quiz Completed!",
                description: "Your score has been saved.",
            });
        },
    });

    const currentQuestion = questions?.[currentQuestionIndex];

    useEffect(() => {
        if (quizFinished && questions && userAnswers.length === questions.length) {
            const score = calculateScore();
            submitQuiz.mutate({
                questionIds: questions.map((q) => q.id),
                userAnswers: userAnswers,
                score,
                totalQuestions: questions.length,
                topic,
                timeSpent: questions.reduce((acc, q) => acc + q.timeLimit, 0),
            });
        }
    }, [quizFinished]);

    // Timer countdown
    useEffect(() => {
        if (!quizStarted || showExplanation || !currentQuestion || quizFinished) return;

        setTimeLeft(currentQuestion.timeLimit);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNextQuestion();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestionIndex, quizStarted, showExplanation, currentQuestion]);

    const handleStartQuiz = () => {
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setQuizFinished(false);
        refetch();
    };

    const handleAnswerSelect = (answerIndex: number) => {
        if (showExplanation) return;
        setSelectedAnswer(answerIndex);
    };

    const handleSubmitAnswer = () => {
        if (selectedAnswer === null || showExplanation) {
            if (selectedAnswer === null) {
                toast({
                    title: "Select an answer",
                    description: "Please select an option before continuing.",
                    variant: "destructive",
                });
            }
            return;
        }

        // Prevent duplicate answers for the same question
        if (userAnswers.length > currentQuestionIndex) {
            return;
        }

        setUserAnswers((prev) => [...prev, selectedAnswer]);
        setShowExplanation(true);
    };

    const handleNextQuestion = () => {
        if (!questions) return;

        // Ensure an answer is recorded for the current question if not already present
        // (e.g., if timer ran out or user skipped)
        if (userAnswers.length === currentQuestionIndex) {
            setUserAnswers((prev) => [...prev, -1]);
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            // Quiz finished
            // Use the updated userAnswers for score calculation
            // Since setUserAnswers is async, we may need to calculate score again carefully
            setQuizFinished(true);
            triggerConfetti.realistic();
        }
    };

    const calculateScore = () => {
        if (!questions || !userAnswers) return 0;
        return userAnswers.reduce((acc, ans, idx) => {
            if (idx >= questions.length) return acc;
            return ans === questions[idx].correctAnswer ? acc + 1 : acc;
        }, 0);
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizFinished(false);
    };

    if (!quizStarted) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center"
            >
                <Card className="max-w-2xl w-full border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                    <CardHeader>
                        <Link href="/challenges">
                            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4 w-fit">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Challenges
                            </Button>
                        </Link>
                        <CardTitle className="text-3xl font-black text-white flex items-center gap-3">
                            <Brain className="h-8 w-8 text-purple-400" />
                            Algorithm Quiz
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-slate-400">
                            Test your algorithm knowledge with timed multiple-choice questions. Select a topic and difficulty to begin!
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-300 mb-2 block">Topic</label>
                                <Select value={topic} onValueChange={setTopic}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="arrays">Arrays</SelectItem>
                                        <SelectItem value="strings">Strings</SelectItem>
                                        <SelectItem value="linkedlists">Linked Lists</SelectItem>
                                        <SelectItem value="trees">Trees</SelectItem>
                                        <SelectItem value="graphs">Graphs</SelectItem>
                                        <SelectItem value="dp">Dynamic Programming</SelectItem>
                                        <SelectItem value="sorting">Sorting & Searching</SelectItem>
                                        <SelectItem value="greedy">Greedy Algorithms</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-300 mb-2 block">Difficulty</label>
                                <Select value={difficulty} onValueChange={setDifficulty}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            onClick={handleStartQuiz}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-6 text-lg"
                        >
                            Start Quiz (2 Questions)
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (quizFinished) {
        const score = calculateScore();
        const percentage = Math.round((score / (questions?.length || 1)) * 100);

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center"
            >
                <Card className="max-w-2xl w-full border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <CardTitle className="text-4xl font-black text-white">Quiz Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="text-6xl font-black text-purple-400">{percentage}%</div>
                            <p className="text-slate-300 text-lg">
                                You got <span className="text-green-400 font-bold">{score}</span> out of{" "}
                                <span className="text-blue-400 font-bold">{questions?.length}</span> correct!
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={resetQuiz} variant="outline" className="border-slate-600">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={() => setLocation("/challenges")} className="bg-gradient-to-r from-purple-500 to-pink-500">
                                Back to Challenges
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
                <div className="text-white">Loading questions...</div>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / (questions?.length || 1)) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="text-slate-400 text-sm font-semibold">
                        Question {currentQuestionIndex + 1} of {questions?.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-400" />
                        <span className={`text-2xl font-black ${timeLeft < 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <Progress value={progress} className="h-2" />

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className="p-3 bg-purple-500/20 rounded-lg">
                                        <Brain className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-purple-400 font-bold uppercase mb-2">
                                            {currentQuestion.topic} • {currentQuestion.difficulty}
                                        </div>
                                        <CardTitle className="text-xl text-white leading-relaxed">
                                            {currentQuestion.question}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Code Snippet */}
                                {currentQuestion.codeSnippet && (
                                    <pre className="p-4 bg-slate-900 rounded-lg text-sm text-slate-300 overflow-x-auto border border-slate-700">
                                        <code>{currentQuestion.codeSnippet}</code>
                                    </pre>
                                )}

                                {/* Options */}
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, idx) => {
                                        const isSelected = selectedAnswer === idx;
                                        const isCorrect = idx === currentQuestion.correctAnswer;
                                        const showResult = showExplanation;

                                        let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all ";
                                        if (showResult) {
                                            if (isCorrect) {
                                                buttonClass += "border-green-500 bg-green-500/20 text-green-300";
                                            } else if (isSelected && !isCorrect) {
                                                buttonClass += "border-red-500 bg-red-500/20 text-red-300";
                                            } else {
                                                buttonClass += "border-slate-700 bg-slate-800/50 text-slate-400";
                                            }
                                        } else {
                                            buttonClass += isSelected
                                                ? "border-purple-500 bg-purple-500/20 text-white"
                                                : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-purple-500/50";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelect(idx)}
                                                disabled={showExplanation}
                                                className={buttonClass}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{option}</span>
                                                    {showResult && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                                                    {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-400" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Explanation */}
                                {showExplanation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                                    >
                                        <div className="text-sm font-semibold text-blue-400 mb-2">Explanation:</div>
                                        <div className="text-sm text-slate-300">{currentQuestion.explanation}</div>
                                    </motion.div>
                                )}

                                {/* Action Button */}
                                {!showExplanation ? (
                                    <Button
                                        onClick={handleSubmitAnswer}
                                        disabled={selectedAnswer === null}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50"
                                    >
                                        Submit Answer
                                    </Button>
                                ) : (
                                    <Button onClick={handleNextQuestion} className="w-full bg-gradient-to-r from-green-500 to-emerald-500">
                                        {currentQuestionIndex < (questions?.length || 0) - 1 ? (
                                            <>
                                                Next Question
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </>
                                        ) : (
                                            "Finish Quiz"
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
