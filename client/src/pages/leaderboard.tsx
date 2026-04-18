import { Card, CardContent, CardHeader, CardTitle, MotionCard } from "@/components/ui/card";
import { Trophy, Medal, Award, Star, Activity, Target, Zap, Crown } from "lucide-react";
import ParticlesBackground from "@/components/layout/particles-background";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/layout/page-transition";

const leaderboardData = [
    { rank: 1, username: "Alex", contestsParticipated: 25, problemsSolved: 320, score: 1850 },
    { rank: 2, username: "Roshini", contestsParticipated: 22, problemsSolved: 290, score: 1700 },
    { rank: 3, username: "Sam", contestsParticipated: 20, problemsSolved: 260, score: 1600 },
    { rank: 4, username: "Priya", contestsParticipated: 18, problemsSolved: 230, score: 1450 },
    { rank: 5, username: "John", contestsParticipated: 15, problemsSolved: 200, score: 1300 },
];

export default function Leaderboard() {
    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return { icon: Crown, color: "text-amber-400", glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]", bg: "bg-amber-400/10 border-amber-400/20" };
            case 2:
                return { icon: Medal, color: "text-slate-300", glow: "shadow-[0_0_20px_rgba(203,213,225,0.2)]", bg: "bg-slate-300/10 border-slate-300/20" };
            case 3:
                return { icon: Award, color: "text-orange-400", glow: "shadow-[0_0_20px_rgba(251,146,60,0.2)]", bg: "bg-orange-400/10 border-orange-400/20" };
            default:
                return null;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <PageTransition>
            <motion.div
                initial="hidden"
                animate="show"
                variants={containerVariants}
                className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative"
            >
                {/* Particle Background */}
                <ParticlesBackground />
                <motion.div variants={itemVariants} className="mb-12">
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        Elite <span className="text-gradient-primary">Standings</span>
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Behold the top-tier operatives dominating the arena simulation.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] p-6">
                            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3 text-white">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Neural Protocol Leaderboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-950/50 border-b border-white/5">
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rank</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operative</th>
                                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Engagements</th>
                                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Decryptions</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Power Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {leaderboardData.map((user, idx) => {
                                            const badge = getRankBadge(user.rank);
                                            const Icon = badge?.icon;

                                            return (
                                                <motion.tr
                                                    key={user.rank}
                                                    variants={itemVariants}
                                                    className={`group transition-all duration-300 hover:bg-white/[0.03] active:bg-white/[0.05] selection:bg-blue-500/30`}
                                                >
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            {Icon ? (
                                                                <div className={`p-2 rounded-lg ${badge.bg} ${badge.glow} transition-transform group-hover:scale-110`}>
                                                                    <Icon className={`h-4 w-4 ${badge.color}`} />
                                                                </div>
                                                            ) : (
                                                                <span className="w-8 text-[11px] font-black text-slate-600 text-center">#{user.rank}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                                                                {user.username}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Verified Operative</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-bold text-slate-300">{user.contestsParticipated}</span>
                                                            <Activity className="h-3 w-3 text-slate-700 mt-1" />
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-bold text-slate-300">{user.problemsSolved}</span>
                                                            <Target className="h-3 w-3 text-slate-700 mt-1" />
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-base font-black text-emerald-400 flex items-center gap-1.5 leading-none">
                                                                {user.score}
                                                                <Zap className="h-3 w-3 fill-emerald-400 mb-0.5" />
                                                            </span>
                                                            <Star className="h-2.5 w-2.5 text-slate-800 mt-1" />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden space-y-4 p-6">
                                {leaderboardData.map((user) => {
                                    const badge = getRankBadge(user.rank);
                                    const Icon = badge?.icon;

                                    return (
                                        <Card key={user.rank} className="border-white/5 bg-white/[0.02] shadow-xl">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        {Icon && (
                                                            <div className={`p-2 rounded-lg ${badge.bg}`}>
                                                                <Icon className={`h-4 w-4 ${badge.color}`} />
                                                            </div>
                                                        )}
                                                        <span className="text-lg font-black text-white">#{user.rank}</span>
                                                    </div>
                                                    <span className="text-lg font-black text-emerald-400">
                                                        {user.score} PX
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-slate-950/50 p-2 rounded-xl text-center">
                                                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">User</div>
                                                        <div className="text-[10px] font-black text-white truncate">{user.username}</div>
                                                    </div>
                                                    <div className="bg-slate-950/50 p-2 rounded-xl text-center">
                                                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Active</div>
                                                        <div className="text-[10px] font-black text-white">{user.contestsParticipated}</div>
                                                    </div>
                                                    <div className="bg-slate-950/50 p-2 rounded-xl text-center">
                                                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Solved</div>
                                                        <div className="text-[10px] font-black text-white">{user.problemsSolved}</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-10 text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 bg-white/5" />
                        Hall of Fame Protocol // Standings Calibrated every 24H
                        <div className="h-[1px] w-12 bg-white/5" />
                    </p>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
