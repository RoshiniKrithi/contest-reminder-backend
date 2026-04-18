import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, MotionCard } from "@/components/ui/card";
import { Trophy, Code, Bell, ExternalLink, Clock, Calendar, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProgressGraph from "@/components/progress/progress-graph";
import DailyStreakCard from "@/components/dashboard/daily-streak-card";
import ParticlesBackground from "@/components/layout/particles-background";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import PageTransition from "@/components/layout/page-transition";

import { triggerConfetti } from "@/lib/confetti";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ["/api/contests/all"],
    refetchInterval: 60000,
  });

  const liveContests = Array.isArray(contests) ? contests.filter((c: any) => c.status === "ongoing") : [];
  const upcomingContests = Array.isArray(contests) ? contests.filter((c: any) => c.status === "upcoming").slice(0, 5) : [];

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
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = end - now;

    if (remaining <= 0) return "Ended";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  const statsCards = [
    {
      title: "Contests Attended",
      value: stats?.totalScore || 47,
      icon: Trophy,
      color: "bg-blue-500/10",
      iconColor: "text-blue-400",
      border: "border-blue-500/20"
    },
    {
      title: "Active Contests",
      value: liveContests.length,
      icon: Activity,
      color: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      border: "border-emerald-500/20"
    },
    {
      title: "Problems Solved",
      value: stats?.problemsSolved || 342,
      icon: Code,
      color: "bg-violet-500/10",
      iconColor: "text-violet-400",
      border: "border-violet-500/20"
    },
    {
      title: "Upcoming Reminders",
      value: upcomingContests.length,
      icon: Bell,
      color: "bg-rose-500/10",
      iconColor: "text-rose-400",
      border: "border-rose-500/20"
    },
  ];

  return (
    <PageTransition>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative"
      >
        <ParticlesBackground />

        {/* Header Section */}
        <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              Coding <span className="text-gradient-primary">Arena</span>
            </h1>
            <p className="text-slate-400 font-medium">Welcome back, Commander. Here's your status report.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => triggerConfetti.cannons()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black border-none shadow-[0_0_20px_rgba(79,70,229,0.4)] px-6"
            >
              <Zap className="h-4 w-4 mr-2" /> CELEBRATE MISSION
            </Button>
          </div>
        </motion.div>

        {/* Dashboard Stats */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => (
            <MotionCard
              key={index}
              variants={itemVariants}
              className="card-hover border-white/5 bg-slate-900/40"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">
                      {stat.title}
                    </p>
                    <div className="text-3xl font-black text-white">
                      {statsLoading ? <Skeleton className="h-8 w-20" /> : stat.value.toLocaleString()}
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} ${stat.border} border rounded-2xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className={`${stat.iconColor} h-6 w-6`} />
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
            {/* Live Contests Section */}
            <Card className="border-white/5 bg-slate-900/40">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Battleground: Live
                  </h2>
                </div>
                <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {liveContests.length} ACTIVE NOW
                </span>
              </div>
              <CardContent className="p-0">
                {contestsLoading ? (
                  <div className="p-4 space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : liveContests.length === 0 ? (
                  <div className="py-4 px-6 flex items-center gap-3 text-slate-500 text-sm italic border-t border-white/5">
                    <Zap className="h-4 w-4 opacity-30 shrink-0" />
                    <p>No contests are live right now. Check back soon.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Challenge</TableHead>
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">System</TableHead>
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Window</TableHead>
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ETA</TableHead>
                          <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-[10px]">Uplink</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {liveContests.map((contest: any) => (
                            <motion.tr
                              key={contest.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="group border-white/5 hover:bg-white/[0.02] transition-colors"
                            >
                              <TableCell className="font-bold text-slate-200">
                                {contest.title}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                  {contest.platform}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-400 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {contest.duration ? formatDuration(contest.duration) : "--"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-emerald-400 font-bold text-sm">
                                  {contest.endTime ? getTimeRemaining(contest.endTime) : "LIVE"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-white/10 hover:bg-white hover:text-slate-950 transition-all font-bold"
                                  onClick={() => {
                                    triggerConfetti.basic();
                                    window.open(contest.url, '_blank');
                                  }}
                                >
                                  JOIN <ExternalLink className="h-3 w-3 ml-1.5" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Contests Section */}
            <Card className="border-white/5 bg-slate-900/40">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Briefing: Upcoming
                  </h2>
                </div>
              </div>
              <CardContent className="p-0">
                {contestsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : upcomingContests.length === 0 ? (
                  <p className="text-slate-500 text-center py-10 italic">No future missions detected.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mission</TableHead>
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sector</TableHead>
                          <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Launch</TableHead>
                          <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-[10px]">Intel</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingContests.map((contest: any) => (
                          <TableRow key={contest.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                            <TableCell className="font-bold text-slate-200">
                              {contest.title}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                                {contest.platform}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {contest.startTime ? formatDateTime(contest.startTime) : "TBD"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-slate-400 hover:text-white transition-colors font-bold"
                                onClick={() => window.open(contest.url, '_blank')}
                              >
                                VIEW <ExternalLink className="h-3 w-3 ml-1.5 opacity-50" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={itemVariants} className="space-y-8">
            <DailyStreakCard />
            <ProgressGraph className="border-white/5 bg-slate-900/40" />
          </motion.div>
        </div>
      </motion.div>
    </PageTransition>
  );
}

