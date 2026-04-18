import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, MotionCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Trophy, Target, Shield, Zap, Info, ChevronRight, Terminal } from "lucide-react";
import ContestTimer from "@/components/contests/contest-timer";
import CodeEditor from "@/components/code-editor/code-editor";
import ParticlesBackground from "@/components/layout/particles-background";
import { motion, AnimatePresence } from "framer-motion";
import type { Contest, Problem } from "@shared/schema";
import PageTransition from "@/components/layout/page-transition";

export default function ContestDetail() {
  const [, params] = useRoute("/contest/:id");
  const contestId = params?.id;

  const { data: contest, isLoading: contestLoading } = useQuery<Contest>({
    queryKey: ["/api/contests", contestId],
    enabled: !!contestId,
  });

  const { data: problems, isLoading: problemsLoading } = useQuery<Problem[]>({
    queryKey: ["/api/contests", contestId, "problems"],
    enabled: !!contestId,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (contestLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-12">
          <div className="space-y-4">
            <div className="h-10 bg-white/5 rounded-xl w-1/3"></div>
            <div className="h-4 bg-white/5 rounded-lg w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-white/5 rounded-2xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-white/5 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-xl p-12 text-center max-w-md rounded-3xl">
          <Info className="h-12 w-12 text-blue-400 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Signal Lost</h3>
          <p className="text-slate-500 font-medium">
            The requested tactical briefing could not be retrieved from the main server.
          </p>
        </Card>
      </div>
    );
  }

  const isLive = contest.status === "live";
  const isUpcoming = contest.status === "upcoming";

  const formatDateTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
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
        {/* Header / Mission Briefing */}
        <motion.div variants={itemVariants} className="mb-12 relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${isLive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10" :
                  isUpcoming ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10" :
                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}>
                  <span className={`h-2 w-2 rounded-full mr-2 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                  {contest.status} Protocol
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <Shield className="h-3 w-3" />
                  Sector {contest.id}
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
                {contest.title}
              </h1>
              <p className="text-slate-400 font-medium max-w-2xl text-lg leading-relaxed">
                {contest.description || "In-depth algorithmic simulation authorized for elite operatives."}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white leading-none">{(contest.participants || 0).toLocaleString()}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Agents Active</span>
                </div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white leading-none">{(problems?.length || 0)}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Nodes Detected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-8 py-6 border-y border-white/5">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Commencement</span>
                <span className="text-xs font-bold text-slate-300">{formatDateTime(contest.startTime)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Operational Window</span>
                <span className="text-xs font-bold text-slate-300">{getDuration()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security Clearance</span>
                <span className="text-xs font-bold text-emerald-400">Level 4 Certified</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            <Tabs defaultValue="problems" className="w-full">
              <TabsList className="bg-slate-900 p-1 rounded-2xl border border-white/5 mb-8 h-12">
                <TabsTrigger value="problems" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-950">
                  Tactical Nodes
                </TabsTrigger>
                <TabsTrigger value="submissions" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-950">
                  Intel Log
                </TabsTrigger>
                {isLive && (
                  <TabsTrigger value="editor" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-950">
                    Command Terminal
                  </TabsTrigger>
                )}
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="problems" className="mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 gap-4">
                    {problemsLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />
                      ))
                    ) : problems?.length === 0 ? (
                      <Card className="bg-slate-900/40 border-white/5 p-12 text-center rounded-3xl">
                        <Terminal className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No problem signatures detected in this sector.</p>
                      </Card>
                    ) : (
                      problems?.map((problem: Problem, index: number) => (
                        <MotionCard
                          key={problem.id}
                          variants={itemVariants}
                          whileHover={{ x: 8 }}
                          className="group bg-slate-900/40 border-white/5 hover:bg-slate-900/60 hover:border-blue-500/20 transition-all rounded-2xl overflow-hidden p-6 relative"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
                                  {problem.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/10 text-slate-500">{problem.difficulty}</Badge>
                                  <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                    <Zap className="h-3 w-3 fill-emerald-400" />
                                    {problem.points} PX
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" className="bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 hover:border-white/20 px-6 font-black uppercase text-[10px] tracking-widest group/btn">
                              Access node
                              <ChevronRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2 max-w-3xl pl-14">
                            {problem.description || "Decrypt the underlying algorithm pattern to secure the node and earn power points."}
                          </p>
                        </MotionCard>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="submissions" className="mt-0">
                  <Card className="bg-slate-900/40 border-white/5 p-20 text-center rounded-3xl">
                    <Shield className="h-12 w-12 text-slate-800 mx-auto mb-6" />
                    <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">System Logs Clear</h4>
                    <p className="text-slate-500 font-medium">No recorded attempts or successful decryptions found for this operative.</p>
                  </Card>
                </TabsContent>

                <TabsContent value="editor" className="mt-0">
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                    <CodeEditor />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {isLive && (
              <motion.div variants={itemVariants}>
                <ContestTimer contest={contest} />
              </motion.div>
            )}

            <MotionCard variants={itemVariants} className="bg-slate-900/40 border-white/5 backdrop-blur-md rounded-3xl p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] -mr-16 -mt-16 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="h-5 w-5 text-amber-500" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Arena Hall of Fame</h4>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Alpha_Prime", score: "4,200", rank: 1 },
                    { name: "Neon_Ghost", score: "3,850", rank: 2 },
                    { name: "Static_Void", score: "3,400", rank: 3 }
                  ].map((user) => (
                    <div key={user.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black ${user.rank === 1 ? 'text-amber-500' : 'text-slate-600'}`}>#{user.rank}</span>
                        <span className="text-xs font-black text-slate-300">{user.name}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400">{user.score}</span>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">
                  View Full Standings
                </Button>
              </div>
            </MotionCard>
          </div>
        </div>
      </motion.div>
    </PageTransition>
  );
}


