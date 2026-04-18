import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyChallengeData {
    problemId: string;
    title: string;
    difficulty: string;
    streak: number;
    solvedToday: boolean;
}

export default function DailyStreakCard() {
    const { data: daily, isLoading } = useQuery<DailyChallengeData>({
        queryKey: ["/api/daily-challenge"],
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return <Skeleton className="h-48 w-full rounded-3xl" />;
    }

    if (!daily) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group"
        >
            <div className={`absolute -inset-0.5 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500 ${daily.solvedToday ? "bg-orange-500" : "bg-slate-700"
                }`} />

            <Card className="relative bg-slate-900/90 border-white/5 backdrop-blur-xl overflow-hidden rounded-3xl">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${daily.solvedToday
                                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                    : "bg-slate-700/50 text-slate-400 border border-white/5"
                                    }`}>
                                    Daily Operation
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-white leading-tight">
                                {daily.title}
                            </h3>
                        </div>

                        <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border ${daily.solvedToday
                            ? "bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                            : "bg-slate-800/50 border-white/5"
                            }`}>
                            <Flame className={`h-6 w-6 transition-all duration-700 ${daily.solvedToday
                                ? "text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                                : "text-slate-600"
                                }`} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                                    Current Streak
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${daily.solvedToday ? "text-orange-400" : "text-white"}`}>
                                        {daily.streak}
                                    </span>
                                    <span className="text-sm font-bold text-slate-500">DAYS</span>
                                </div>
                            </div>

                            {daily.solvedToday ? (
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                                </div>
                            ) : (
                                <Link href={`/problems/${daily.problemId}`}>
                                    <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl h-10 px-4 shadow-lg shadow-white/5">
                                        Deploy
                                        <ArrowRight className="h-3 w-3 ml-2" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Progress Bar (Visual Flair) */}
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${daily.solvedToday ? "bg-orange-500 w-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-slate-600 w-[5%]"
                                    }`}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
