import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Clock, Code, Trophy, Zap, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import ParticlesBackground from "@/components/layout/particles-background";
import { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/page-transition";

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    points: number;
    timeLimit: number;
    memoryLimit: number;
    contestId: string;
}

export default function ProblemDetail() {
    const [, params] = useRoute("/problems/:id");
    const id = params?.id;
    const { user } = useAuth();
    const { toast } = useToast();
    const [code, setCode] = useState("// Write your solution here\n\nfunction solve(input) {\n  \n}");

    const { data: problem, isLoading } = useQuery<Problem>({
        queryKey: [`/api/problems/${id}`],
        enabled: !!id,
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/submissions", {
                problemId: id,
                userId: user?.id,
                code,
                language: "javascript",
                status: "pending", // Server will decide status
            });
            if (!res.ok) throw new Error("Submission failed");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/daily-challenge"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/activity"] });

            const isAccepted = data.status === "accepted";

            toast({
                title: isAccepted ? "Mission Accomplished" : "Mission Failed",
                description: isAccepted
                    ? `Correct answer! +${problem?.points} points awarded.`
                    : "Your solution did not pass the test cases.",
                variant: isAccepted ? "default" : "destructive",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to submit solution. Please try again.",
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="container max-w-7xl mx-auto px-4 py-8">
                <Skeleton className="h-12 w-1/3 mb-8" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="container max-w-7xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Problem Not Found</h1>
                <Link href="/problems">
                    <Button variant="outline">Return to Archives</Button>
                </Link>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            case "hard": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        }
    };

    return (
        <PageTransition>
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                <ParticlesBackground />

                <div className="mb-8">
                    <Link href="/problems">
                        <Button variant="ghost" className="pl-0 text-slate-400 hover:text-white mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Archives
                        </Button>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 ${getDifficultyColor(problem.difficulty)}`}>
                                    {problem.difficulty}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-blue-400">
                                    <Trophy className="h-4 w-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">{problem.points} PX</span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                {problem.title}
                            </h1>
                        </div>

                        <div className="flex items-center gap-6 text-slate-400">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{problem.timeLimit}ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{problem.memoryLimit}MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)] min-h-[600px]">
                    {/* Problem Description */}
                    <Card className="bg-slate-950/50 backdrop-blur-xl border-white/5 flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
                                <AlertCircle className="h-5 w-5 text-blue-500" />
                                Mission Brief
                            </CardTitle>
                        </CardHeader>
                        <Separator className="bg-white/5" />
                        <CardContent className="flex-1 overflow-y-auto p-6">
                            <div className="prose prose-invert max-w-none">
                                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                    {problem.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Code Editor */}
                    <Card className="bg-slate-950/50 backdrop-blur-xl border-white/5 flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
                                <Code className="h-5 w-5 text-emerald-500" />
                                Solution Interface
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => submitMutation.mutate()}
                                    disabled={submitMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide"
                                >
                                    {submitMutation.isPending ? (
                                        <span className="animate-pulse">Transmitting...</span>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                            Execute
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <Separator className="bg-white/5" />
                        <CardContent className="flex-1 p-0 relative group">
                            <div className="absolute inset-0 bg-slate-950/80 m-4 rounded-xl border border-white/10 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">JavaScript</span>
                                </div>
                                <Textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-full bg-transparent border-0 resize-none font-mono text-sm p-4 text-slate-300 focus-visible:ring-0"
                                    spellCheck={false}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTransition>
    );
}
