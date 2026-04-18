import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, MotionCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  Filter,
  Star,
  Zap,
  Flame,
  BarChart3
} from "lucide-react";
import CourseCard from "@/components/courses/course-card";
import ParticlesBackground from "@/components/layout/particles-background";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Course } from "@shared/schema";
import PageTransition from "@/components/layout/page-transition";

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    staleTime: 5 * 60 * 1000,
  });

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty === difficultyFilter;
    return matchesSearch && matchesLevel && matchesDifficulty;
  });

  const levels = Array.from(new Set(courses.map((c) => c.level)));
  const difficulties = Array.from(new Set(courses.map((c) => c.difficulty)));
  const beginnerCourses = filteredCourses.filter((c) => c.level === "beginner");
  const intermediateCourses = filteredCourses.filter((c) => c.level === "intermediate");
  const advancedCourses = filteredCourses.filter((c) => c.level === "advanced");

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

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 bg-white/5" />
          <Skeleton className="h-4 w-96 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />)}
        </div>
        <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
        <div className="grid gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <MotionCard initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto border-white/5 bg-slate-900/40 p-12">
          <BookOpen className="h-20 w-20 text-slate-700 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white mb-2">Knowledge Base Offline</h1>
          <p className="text-slate-500 mb-8">Unable to synchronize with the academy servers. Please try again later.</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-500">
            Retry Connection
          </Button>
        </MotionCard>
      </div>
    );
  }

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
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              Skill <span className="text-gradient-primary">Academy</span>
            </h1>
            <p className="text-slate-400 font-medium">
              Advanced neural training protocols for elite engineers.
            </p>
          </div>
          <div className="p-1 px-4 bg-blue-600/10 border border-blue-500/20 rounded-full">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">
              Enrolled: {filteredCourses.length} Modules
            </span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: GraduationCap, label: "Foundational", count: beginnerCourses.length, color: "text-emerald-400" },
            { icon: Flame, label: "Intermediate", count: intermediateCourses.length, color: "text-amber-400" },
            { icon: BarChart3, label: "Specialized", count: advancedCourses.length, color: "text-rose-400" }
          ].map((stat, i) => (
            <MotionCard key={i} variants={itemVariants} className="border-white/5 bg-slate-900/40 backdrop-blur-md overflow-hidden group">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-white leading-none mt-1">
                      {stat.count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="mb-10 border-white/5 bg-slate-950/60 backdrop-blur-xl rounded-2xl">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-blue-400" />
                  <Input
                    placeholder="Intercept specific training modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-white/5 border-white/5 focus:border-blue-500/50 h-12 rounded-xl text-white font-medium"
                  />
                </div>
                <div className="flex gap-4">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/5 h-12 rounded-xl text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                      <Filter className="h-3 w-3 mr-2 text-slate-500" />
                      <SelectValue placeholder="Neural Level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                      <SelectItem value="all">Global Access</SelectItem>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level} className="uppercase text-[10px] font-bold tracking-widest py-3">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/5 h-12 rounded-xl text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                      <Zap className="h-3 w-3 mr-2 text-slate-500" />
                      <SelectValue placeholder="Intensity" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                      <SelectItem value="all">Full Spectrum</SelectItem>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty} className="uppercase text-[10px] font-bold tracking-widest py-3">
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Course List */}
        <motion.div variants={containerVariants} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredCourses.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-white/5 bg-slate-900/40 p-20 text-center">
                  <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Target Not Found</h3>
                  <p className="text-slate-500">Adjust your neural parameters to find the desired training module.</p>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <motion.div key={course.id} variants={itemVariants} layout transition={{ duration: 0.3 }}>
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
