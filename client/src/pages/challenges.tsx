import { motion } from "framer-motion";
import { Link } from "wouter";
import { Zap, Brain, Calendar, Trophy, Keyboard, Award, Timer, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface ChallengeStats {
    typing: { completed: number; bestWPM: number };
    quiz: { completed: number; averageScore: number };
    brainTeaser: { streak: number; totalSolved: number };
}

export default function Challenges() {
    const { data: stats } = useQuery<ChallengeStats>({
        queryKey: ["/api/challenges/stats"],
    });

    const challenges = [
        {
            id: "typing",
            title: "Speed Typing",
            description: "Race against time while typing code snippets. Improve your coding speed and accuracy!",
            icon: Keyboard,
            color: "from-blue-500 to-cyan-500",
            shadowColor: "shadow-blue-500/20",
            buttonShadow: "hover:shadow-blue-500/50",
            bgGradient: "from-blue-500/10 to-cyan-500/10",
            link: "/challenges/typing",
            stats: stats?.typing ? `Best: ${stats.typing.bestWPM} WPM | Completed: ${stats.typing.completed}` : "Start your first challenge!",
            iconBg: "bg-blue-500/20",
            iconColor: "text-blue-400",
        },
        {
            id: "brain-teaser",
            title: "Daily Brain Teaser",
            description: "Solve a new puzzle every day! Build your streak and sharpen your problem-solving skills.",
            icon: Target,
            color: "from-orange-500 to-red-500",
            shadowColor: "shadow-orange-500/20",
            buttonShadow: "hover:shadow-orange-500/50",
            bgGradient: "from-orange-500/10 to-red-500/10",
            link: "/challenges/brain-teaser",
            stats: stats?.brainTeaser ? `🔥 ${stats.brainTeaser.streak} Day Streak | Solved: ${stats.brainTeaser.totalSolved}` : "Start your streak today!",
            iconBg: "bg-orange-500/20",
            iconColor: "text-orange-400",
        },
        {
            id: "quiz",
            title: "Algorithm Quiz",
            description: "Test your algorithm knowledge with timed multiple-choice questions. Master data structures!",
            icon: Brain,
            color: "from-purple-500 to-pink-500",
            shadowColor: "shadow-purple-500/20",
            buttonShadow: "hover:shadow-purple-500/50",
            bgGradient: "from-purple-500/10 to-pink-500/10",
            link: "/challenges/quiz",
            stats: stats?.quiz ? `Avg Score: ${stats.quiz.averageScore}% | Completed: ${stats.quiz.completed}` : "Start your first quiz!",
            iconBg: "bg-purple-500/20",
            iconColor: "text-purple-400",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center space-y-4"
                >
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/50">
                            <Zap className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight">
                        Mini-Games & <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Challenges</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Sharpen your coding skills through fun and engaging challenges. Compete, learn, and track your progress!
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {challenges.map((challenge, index) => {
                        const IconComponent = challenge.icon;
                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className="flex"
                            >
                                <Card className={`flex-1 group relative overflow-hidden border-slate-700/50 bg-gradient-to-br ${challenge.bgGradient} backdrop-blur-md hover:border-slate-500/50 transition-all duration-500 hover:shadow-2xl hover:${challenge.shadowColor} hover:-translate-y-2`}>
                                    {/* Animated Background Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${challenge.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                                    
                                    {/* Glassmorphism Shine Effect */}
                                    <div className="absolute -inset-full h-[200%] w-[200%] rotate-45 translate-x-[-100%] translate-y-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:duration-1000 group-hover:translate-x-[100%] group-hover:translate-y-[100%] transition-all duration-1000" />

                                    <CardHeader className="relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-4 rounded-2xl ${challenge.iconBg} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                                <IconComponent className={`h-8 w-8 ${challenge.iconColor}`} />
                                            </div>
                                            <div className={`px-4 py-1 rounded-full bg-gradient-to-r ${challenge.color} text-white text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse`}>
                                                New Mission
                                            </div>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-white mt-6 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all duration-500">
                                            {challenge.title}
                                        </CardTitle>
                                        <CardDescription className="text-slate-400 text-sm leading-relaxed mt-2 min-h-[4.5rem]">
                                            {challenge.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="relative z-10 space-y-6">
                                        {/* Stats Indicator */}
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 group-hover:border-slate-600/50 transition-colors duration-300">
                                            <div className={`p-1.5 rounded-lg ${challenge.iconBg}`}>
                                                <Trophy className={`h-4 w-4 ${challenge.iconColor}`} />
                                            </div>
                                            <span className="text-sm text-slate-300 font-bold tracking-wide truncate">{challenge.stats}</span>
                                        </div>

                                        {/* Action Button */}
                                        <Link href={challenge.link}>
                                            <Button
                                                className={`w-full bg-gradient-to-r ${challenge.color} text-white font-black py-7 rounded-2xl ${challenge.buttonShadow} transform hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl overflow-hidden group/btn`}
                                            >
                                                <Timer className="h-5 w-5 mr-2 group-hover/btn:rotate-12 transition-transform" />
                                                ENTER MISSION
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="mt-16"
                >
                    <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        <CardHeader className="border-b border-slate-700/50 bg-slate-800/50">
                            <CardTitle className="text-3xl font-black text-white flex items-center gap-4">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Award className="h-7 w-7 text-yellow-400" />
                                </div>
                                Personnel Achievement Record
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-base font-medium">
                                Tracking your combat performance and tactical progress across all sectors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    {
                                        label: "Typing Challenges",
                                        value: stats?.typing?.completed || 0,
                                        icon: Keyboard,
                                        sub: `Best: ${stats?.typing?.bestWPM || 0} WPM`,
                                        color: "blue"
                                    },
                                    {
                                        label: "Quizzes Completed",
                                        value: stats?.quiz?.completed || 0,
                                        icon: Brain,
                                        sub: `Avg: ${stats?.quiz?.averageScore || 0}%`,
                                        color: "purple"
                                    },
                                    {
                                        label: "Teaser Streak",
                                        value: `🔥 ${stats?.brainTeaser?.streak || 0}`,
                                        icon: Zap,
                                        sub: "Active Streak",
                                        color: "orange"
                                    },
                                    {
                                        label: "Puzzles Solved",
                                        value: stats?.brainTeaser?.totalSolved || 0,
                                        icon: Target,
                                        sub: "Brain Teasers",
                                        color: "emerald"
                                    }
                                ].map((stat, i) => {
                                    const colorMap: Record<string, string> = {
                                        blue: "bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30 text-blue-400 text-blue-300/60 bg-blue-500/10",
                                        purple: "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/30 text-purple-400 text-purple-300/60 bg-purple-500/10",
                                        orange: "bg-orange-500/5 border-orange-500/10 hover:border-orange-500/30 text-orange-400 text-orange-300/60 bg-orange-500/10",
                                        emerald: "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 text-emerald-300/60 bg-emerald-500/10"
                                    };
                                    const colors = colorMap[stat.color].split(' ');
                                    
                                    return (
                                        <div key={i} className={`relative group p-6 rounded-2xl ${colors[0]} border ${colors[1]} hover:${colors[2]} transition-all duration-300`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`text-4xl font-black ${colors[3]} group-hover:scale-110 transition-transform duration-300`}>
                                                    {stat.value}
                                                </div>
                                                <div className={`p-2 ${colors[5]} rounded-xl`}>
                                                    <stat.icon className={`h-6 w-6 ${colors[3]}`} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">{stat.label}</div>
                                                <div className={`text-xs font-black ${colors[4]} uppercase tracking-widest`}>{stat.sub}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
