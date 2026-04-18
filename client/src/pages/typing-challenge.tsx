import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Keyboard, Trophy, Zap, Timer, RefreshCw, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { triggerConfetti } from "@/lib/confetti";
import { apiRequest } from "@/lib/queryClient";

interface TypingChallenge {
    id: string;
    title: string;
    code: string;
    language: string;
    difficulty: string;
    lineCount: number;
}

interface LeaderboardEntry {
    username: string;
    wpm: number;
    accuracy: number;
    completedAt: string;
}

export default function TypingChallengePage() {
    const [difficulty, setDifficulty] = useState("easy");
    const [language, setLanguage] = useState("javascript");
    const [refreshKey, setRefreshKey] = useState(0);
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [wpm, setWPM] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: challenge, refetch } = useQuery<TypingChallenge>({
        queryKey: ["/api/challenges/typing/snippets", { difficulty, language, r: refreshKey }],
    });

    const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
        queryKey: ["/api/challenges/typing/leaderboard"],
    });

    const submitScore = useMutation({
        mutationFn: async (data: { challengeId: string; wpm: number; accuracy: number; timeSpent: number }) => {
            const res = await apiRequest("POST", "/api/challenges/typing/submit", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/typing/leaderboard"] });
            queryClient.invalidateQueries({ queryKey: ["/api/challenges/stats"] });
            toast({
                title: "Score Submitted!",
                description: `${wpm} WPM with ${accuracy}% accuracy`,
            });
        },
    });

    useEffect(() => {
        if (!challenge) return;

        const targetText = challenge.code;
        const currentText = input;

        // Start timer on first keystroke
        if (currentText.length === 1 && !startTime) {
            setStartTime(Date.now());
        }

        if (currentText === targetText && !isFinished) {
            // Challenge completed!
            setIsFinished(true);
            triggerConfetti.realistic();
            const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0;
            const words = targetText.split(" ").length;
            const calculatedWPM = Math.round((words / timeSpent) * 60);
            setWPM(calculatedWPM);

            // Calculate accuracy
            let correct = 0;
            for (let i = 0; i < targetText.length; i++) {
                if (targetText[i] === currentText[i]) correct++;
            }
            const calculatedAccuracy = Math.round((correct / targetText.length) * 100);
            setAccuracy(calculatedAccuracy);

            // Submit score
            submitScore.mutate({
                challengeId: challenge.id,
                wpm: calculatedWPM,
                accuracy: calculatedAccuracy,
                timeSpent: Math.round(timeSpent),
            });
        } else {
            // Calculate live accuracy
            let correct = 0;
            const minLen = Math.min(targetText.length, currentText.length);
            for (let i = 0; i < minLen; i++) {
                if (targetText[i] === currentText[i]) correct++;
            }
            if (currentText.length > 0) {
                setAccuracy(Math.round((correct / currentText.length) * 100));
            }

            // Calculate live WPM
            if (startTime) {
                const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
                const wordsTyped = currentText.split(" ").length;
                setWPM(Math.round(wordsTyped / timeElapsed));
            }
        }
    }, [input, challenge, startTime]);

    const handleReset = () => {
        setInput("");
        setStartTime(null);
        setIsFinished(false);
        setWPM(0);
        setAccuracy(100);
        setRefreshKey(prev => prev + 1);
    };

    const handleChange = async (type: "difficulty" | "language", value: string) => {
        if (type === "difficulty") setDifficulty(value);
        if (type === "language") setLanguage(value);
        handleReset();
    };

    const getCharacterColor = (index: number) => {
        if (index >= input.length) return "text-slate-500";
        return input[index] === challenge?.code[index] ? "text-green-400" : "text-red-400";
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/challenges">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Challenges
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Select value={difficulty} onValueChange={(v) => handleChange("difficulty", v)}>
                            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={language} onValueChange={(v) => handleChange("language", v)}>
                            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="java">Java</SelectItem>
                                <SelectItem value="cpp">C++</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Typing Area */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Keyboard className="h-6 w-6 text-blue-400" />
                                        <span className="text-white">{challenge?.title || "Loading..."}</span>
                                    </div>
                                    <Button onClick={handleReset} variant="outline" size="sm" className="border-slate-600">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        New Challenge
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Target Code Display */}
                                <div className="p-4 bg-slate-900 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
                                    <pre className="whitespace-pre-wrap">
                                        {challenge?.code.split("").map((char, idx) => (
                                            <span key={idx} className={getCharacterColor(idx)}>
                                                {char}
                                            </span>
                                        ))}
                                    </pre>
                                </div>

                                {/* Input Textarea */}
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => !isFinished && setInput(e.target.value)}
                                    disabled={isFinished}
                                    placeholder="Start typing here..."
                                    className="w-full h-40 p-4 bg-slate-900 text-white border border-slate-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    autoFocus
                                />

                                {/* Stats Bar */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="text-2xl font-black text-blue-400">{wpm}</div>
                                        <div className="text-xs text-slate-400">WPM</div>
                                    </div>
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="text-2xl font-black text-green-400">{accuracy}%</div>
                                        <div className="text-xs text-slate-400">Accuracy</div>
                                    </div>
                                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        <div className="text-2xl font-black text-purple-400">
                                            {challenge ? `${Math.round((input.length / challenge.code.length) * 100)}%` : "0%"}
                                        </div>
                                        <div className="text-xs text-slate-400">Progress</div>
                                    </div>
                                </div>

                                {/* Completion Message */}
                                {isFinished && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-center"
                                    >
                                        <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                                        <h3 className="text-2xl font-black text-white mb-2">Challenge Complete! 🎉</h3>
                                        <p className="text-slate-300">
                                            You typed at <span className="text-green-400 font-bold">{wpm} WPM</span> with{" "}
                                            <span className="text-blue-400 font-bold">{accuracy}% accuracy</span>
                                        </p>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leaderboard */}
                    <div className="space-y-4">
                        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Award className="h-5 w-5 text-yellow-400" />
                                    Global Leaderboard
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {leaderboard?.slice(0, 10).map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : idx === 1
                                                            ? "bg-slate-300/20 text-slate-300"
                                                            : idx === 2
                                                                ? "bg-orange-500/20 text-orange-400"
                                                                : "bg-slate-700 text-slate-400"
                                                        }`}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{entry.username}</div>
                                                    <div className="text-xs text-slate-400">{entry.accuracy}% accuracy</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-blue-400">{entry.wpm}</div>
                                                <div className="text-xs text-slate-500">WPM</div>
                                            </div>
                                        </div>
                                    ))}
                                    {!leaderboard?.length && (
                                        <div className="text-center text-slate-500 py-8">
                                            No entries yet. Be the first!
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
