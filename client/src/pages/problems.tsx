import { Card, CardContent, MotionCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Code, Clock, Trophy, Filter, Target, CheckCircle2, Zap, BarChart3, Binary } from "lucide-react";
import ParticlesBackground from "@/components/layout/particles-background";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/layout/page-transition";

export default function Problems() {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const problems = [
    {
      id: "1",
      title: "Two Sum",
      difficulty: "easy",
      points: 100,
      solved: true,
      timeLimit: 2000,
      memoryLimit: 256,
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    },
    {
      id: "2",
      title: "Binary Search",
      difficulty: "medium",
      points: 200,
      solved: false,
      timeLimit: 1000,
      memoryLimit: 128,
      description: "Implement binary search algorithm to find a target value in a sorted array.",
    },
    {
      id: "3",
      title: "Maximum Subarray",
      difficulty: "medium",
      points: 250,
      solved: true,
      timeLimit: 2000,
      memoryLimit: 256,
      description: "Find the contiguous subarray which has the largest sum and return its sum.",
    },
    {
      id: "4",
      title: "Merge Intervals",
      difficulty: "hard",
      points: 400,
      solved: false,
      timeLimit: 3000,
      memoryLimit: 512,
      description: "Given an array of intervals, merge all overlapping intervals.",
    },
  ];

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "hard": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
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

  const stats = [
    { label: "Total Intercepted", count: problems.length, icon: Binary, color: "text-blue-400" },
    { label: "Completed", count: problems.filter(p => p.solved).length, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Easy", count: problems.filter(p => p.difficulty === "easy").length, icon: Zap, color: "text-emerald-400" },
    { label: "Medium", count: problems.filter(p => p.difficulty === "medium").length, icon: BarChart3, color: "text-amber-400" },
    { label: "Hard", count: problems.filter(p => p.difficulty === "hard").length, icon: Target, color: "text-rose-400" },
  ];

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
            Tactical <span className="text-gradient-primary">Archives</span>
          </h1>
          <p className="text-slate-400 font-medium">
            Access high-intensity algorithmic simulations to calibrate your performance.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {stats.map((stat, i) => (
            <MotionCard key={i} variants={itemVariants} className="border-white/5 bg-slate-900/40 backdrop-blur-md">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <div className="text-2xl font-black text-white leading-none mb-1">
                  {stat.count}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </CardContent>
            </MotionCard>
          ))}
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="mb-10">
          <Card className="border-white/5 bg-slate-950/60 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex flex-col md:flex-row gap-5">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-blue-400" />
                <Input
                  placeholder="Scan for specific objectives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/5 border-white/5 focus:border-blue-500/50 h-12 rounded-xl text-white font-medium shadow-inner"
                />
              </div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/5 h-12 rounded-xl text-slate-300 font-bold uppercase text-[10px] tracking-widest transition-all hover:bg-white/10">
                  <Filter className="h-3 w-3 mr-2 text-slate-500" />
                  <SelectValue placeholder="Intensity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="all" className="uppercase text-[10px] font-bold tracking-widest py-3 hover:bg-white/5 text-slate-300">Full Spectrum</SelectItem>
                  <SelectItem value="easy" className="uppercase text-[10px] font-bold tracking-widest py-3 hover:bg-white/5 text-emerald-400">Low Intensity</SelectItem>
                  <SelectItem value="medium" className="uppercase text-[10px] font-bold tracking-widest py-3 hover:bg-white/5 text-amber-400">Medium Intensity</SelectItem>
                  <SelectItem value="hard" className="uppercase text-[10px] font-bold tracking-widest py-3 hover:bg-white/5 text-rose-400">High Intensity</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Problems List */}
        <motion.div variants={containerVariants} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredProblems.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-white/5 bg-slate-900/40 p-20 text-center">
                  <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">No Records Found</h3>
                  <p className="text-slate-500">Your scan yielded no results. Adjust your parameters.</p>
                </Card>
              </motion.div>
            ) : (
              filteredProblems.map((problem) => (
                <MotionCard
                  key={problem.id}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  className="group border-white/5 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 transition-all cursor-pointer overflow-hidden relative"
                >
                  <div className={`absolute left-0 top-0 h-full w-1 ${problem.solved ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`} />
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                            {problem.title}
                          </h3>
                          {problem.solved && (
                            <div className="p-1 bg-emerald-500/10 rounded-full">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-400 max-w-3xl leading-relaxed">
                          {problem.description}
                        </p>
                      </div>

                      <div className="flex flex-col md:items-end gap-4 min-w-[200px]">
                        <div className="flex items-center gap-4">
                          <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Trophy className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{problem.points} PX</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
                          <div className="flex items-center gap-4 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span className="text-[9px] font-bold">{problem.timeLimit}ms</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Code className="h-3 w-3" />
                              <span className="text-[9px] font-bold">{problem.memoryLimit}MB</span>
                            </div>
                          </div>
                          <Button size="sm" className={`h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${problem.solved ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'}`}>
                            {problem.solved ? "Re-Run" : "Execute"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </MotionCard>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}

