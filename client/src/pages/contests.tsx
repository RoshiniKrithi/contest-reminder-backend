import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, MotionCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ContestCard from "@/components/contests/contest-card";
import ParticlesBackground from "@/components/layout/particles-background";
import { useState } from "react";
import { Filter, Globe, Activity, Calendar, CheckCircle2, Search, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import PageTransition from "@/components/layout/page-transition";

interface ExternalContest {
  id: string;
  name: string;
  platform: string;
  start_time: string;
  end_time: string;
  duration: number;
  url: string;
  status: "upcoming" | "live" | "completed";
}

export default function Contests() {
  const { data: contests = [], isLoading } = useQuery<ExternalContest[]>({
    queryKey: ["/api/external-contests"],
  });

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const platforms = Array.from(new Set(contests.map(c => c.platform))).sort();

  const filteredContests = selectedPlatform
    ? contests.filter(c => c.platform === selectedPlatform)
    : contests;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 bg-white/5" />
            <Skeleton className="h-4 w-96 bg-white/5" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-24 bg-white/5 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const liveContests = filteredContests.filter((c) => c.status === "live");
  const upcomingContests = filteredContests.filter((c) => c.status === "upcoming");
  const completedContests = filteredContests.filter((c) => c.status === "completed");

  const contestsByPlatform = contests.reduce((acc, contest) => {
    if (!acc[contest.platform]) {
      acc[contest.platform] = { live: [], upcoming: [], completed: [] };
    }
    acc[contest.platform][contest.status].push(contest);
    return acc;
  }, {} as Record<string, { live: ExternalContest[], upcoming: ExternalContest[], completed: ExternalContest[] }>);

  return (
    <PageTransition>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative"
      >
        {/* Particle Background */}
        <ParticlesBackground />
        <motion.div variants={itemVariants} className="mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                Mission <span className="text-gradient-primary">Control</span>
              </h1>
              <p className="text-slate-400 font-medium">Monitoring all active and upcoming global coding maneuvers.</p>
            </div>

            <div className="flex items-center gap-3 p-1.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 flex-wrap">
              <Button
                variant={selectedPlatform === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPlatform(null)}
                className={`text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl transition-all ${selectedPlatform === null ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                <Globe className="h-3.5 w-3.5 mr-2" />
                All Sectors
              </Button>
              {platforms.map((platform) => (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform)}
                  className={`text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl transition-all ${selectedPlatform === platform ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                  {platform}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="live" className="space-y-8">
          <motion.div variants={itemVariants}>
            <TabsList className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-1 rounded-2xl h-14">
              <TabsTrigger value="live" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl h-full px-8 text-xs font-black uppercase tracking-widest transition-all">
                <Activity className="h-4 w-4 mr-2" />
                Deployed ({liveContests.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl h-full px-8 text-xs font-black uppercase tracking-widest transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                Queued ({upcomingContests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl h-full px-8 text-xs font-black uppercase tracking-widest transition-all">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Archived
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="live" className="outline-none">
            {liveContests.length === 0 ? (
              <MotionCard variants={itemVariants} className="border-white/5 bg-slate-900/40">
                <CardContent className="p-20 text-center flex flex-col items-center">
                  <div className="p-4 bg-white/5 rounded-full mb-4">
                    <Zap className="h-10 w-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    Quiet Sector
                  </h3>
                  <p className="text-slate-500 max-w-sm">
                    {selectedPlatform
                      ? `No active live missions detected in the ${selectedPlatform} sector.`
                      : "Standard operational status. No live battlegrounds currently active."
                    }
                  </p>
                </CardContent>
              </MotionCard>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {liveContests.map((contest) => (
                    <motion.div key={contest.id} variants={itemVariants} layout>
                      <ContestCard contest={contest} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="outline-none">
            {upcomingContests.length === 0 ? (
              <MotionCard variants={itemVariants} className="border-white/5 bg-slate-900/40">
                <CardContent className="p-20 text-center">
                  <Search className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">No Queued Missions</h3>
                  <p className="text-slate-500">The briefing room is clear. Nothing on the horizon.</p>
                </CardContent>
              </MotionCard>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {upcomingContests.map((contest) => (
                    <motion.div key={contest.id} variants={itemVariants} layout>
                      <ContestCard contest={contest} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="outline-none">
            {completedContests.length === 0 ? (
              <MotionCard variants={itemVariants} className="border-white/5 bg-slate-900/40">
                <CardContent className="p-20 text-center">
                  <CheckCircle2 className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Archive Empty</h3>
                  <p className="text-slate-500">No mission records have been finalized yet.</p>
                </CardContent>
              </MotionCard>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {completedContests.map((contest) => (
                  <motion.div key={contest.id} variants={itemVariants}>
                    <ContestCard contest={contest} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageTransition>
  );
}

