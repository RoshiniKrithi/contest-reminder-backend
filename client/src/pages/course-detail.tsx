import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, MotionCard } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Clock,
  Star,
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Award,
  Terminal,
  Play,
  Info,
  PlayCircle,
  CheckCircle2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { EnrollmentStatus } from "@/components/courses/enrollment-status";
import ParticlesBackground from "@/components/layout/particles-background";
import { motion, AnimatePresence } from "framer-motion";
import type { Course, Lesson, Enrollment } from "@shared/schema";
import PageTransition from "@/components/layout/page-transition";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Hardcoded course data for the integrated video player
const LECTURES_DATA: Record<string, { title: string; videoUrl: string; duration: string }[]> = {
  "competitive-programming": [
    { title: "Intro to Competitive Programming", videoUrl: "https://www.youtube.com/embed/VbMtwluH980", duration: "15:20" },
    { title: "Time Complexity & Big O Notation", videoUrl: "https://www.youtube.com/embed/D6xkbGLQesk", duration: "22:45" },
    { title: "Sliding Window Technique", videoUrl: "https://www.youtube.com/embed/MK-NZ4hN7rs", duration: "18:10" }
  ],
  "system-design": [
    { title: "System Design Introduction", videoUrl: "https://www.youtube.com/embed/bBTPZ9NdSk8", duration: "12:30" },
    { title: "Load Balancing", videoUrl: "https://www.youtube.com/embed/K0Ta65OqQkY", duration: "19:05" }
  ],
  "data-structures": [
    { title: "Advanced Data Structures", videoUrl: "https://www.youtube.com/embed/oSWTXtMglKE", duration: "25:00" },
    { title: "Graph Theory Basics", videoUrl: "https://www.youtube.com/embed/cWNEl4HE2OE", duration: "30:15" }
  ]
};

const DEFAULT_LECTURES = [
  { title: "Welcome to the Course", videoUrl: "https://www.youtube.com/embed/jS4aFq5-91M", duration: "05:00" },
  { title: "Core Concepts Overview", videoUrl: "https://www.youtube.com/embed/VbMtwluH980", duration: "45:00" }
];

export default function CourseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: course, isLoading: courseLoading, error: courseError } = useQuery<Course>({
    queryKey: ["/api/courses", id],
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", id, "lessons"],
    enabled: !!id,
  });

  const { data: enrollment } = useQuery<Enrollment>({
    queryKey: ["/api/users", userId, "courses", id, "enrollment"],
    retry: false,
    enabled: !!id && !!userId,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("POST", `/api/courses/${courseId}/enroll`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "courses", id, "enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
  });

  const [isLearning, setIsLearning] = useState(false);
  const [currentLectureIdx, setCurrentLectureIdx] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("learning") === "true") {
      setIsLearning(true);
    }
  }, []);
  const getLectures = () => {
    if (!id) return DEFAULT_LECTURES;
    return LECTURES_DATA[id] || (course?.title.toLowerCase().includes("competitive") ? LECTURES_DATA["competitive-programming"] : DEFAULT_LECTURES);
  };

  const currentLectures = getLectures();

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

  if (courseLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-10">
          <div className="h-10 bg-white/5 rounded-2xl w-1/4 mb-10"></div>
          <div className="h-64 bg-white/5 rounded-3xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-white/5 rounded-2xl"></div>
              <div className="h-96 bg-white/5 rounded-2xl"></div>
            </div>
            <div className="h-64 bg-white/5 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
        <Terminal className="h-16 w-16 text-slate-800 mb-6" />
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Briefing Unavailable</h1>
        <p className="text-slate-500 font-medium mb-8">Intelligence suggests this course module has been declassified or moved.</p>
        <Link href="/courses">
          <Button className="bg-white text-slate-950 hover:bg-slate-200 rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">
            <ArrowLeft className="w-3 h-3 mr-2" />
            Return to Fleet
          </Button>
        </Link>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "intermediate": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "advanced": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
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
        <motion.div variants={itemVariants} className="mb-8">
          <Link href="/courses">
            <Button variant="ghost" className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl px-4 font-black uppercase text-[10px] tracking-widest">
              <ArrowLeft className="w-3 h-3 mr-2" />
              Tactical Modules
            </Button>
          </Link>
        </motion.div>

        {/* Hero Briefing Section */}
        <motion.div variants={itemVariants} className="relative mb-12 rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-900 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-slate-950 to-purple-600/20 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />

          <div className="relative z-10 p-10 lg:p-16">
            <div className="flex flex-col lg:flex-row justify-between gap-10">
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${getLevelColor(course.level)}`}>
                    {course.level} Operative
                  </Badge>
                  <div className="h-1 w-1 rounded-full bg-slate-700" />
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Clock className="h-3 w-3" />
                    {course.duration} Window
                  </div>
                </div>

                <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter max-w-3xl leading-[1.1]">
                  {course.title}
                </h1>

                <p className="text-lg text-slate-400 font-medium max-w-2xl leading-relaxed">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-8 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Lead Instructor</span>
                      <span className="text-sm font-bold text-white leading-none">{course.instructor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-500">
                      <Star className="h-5 w-5 fill-amber-500/20" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Rating</span>
                      <span className="text-sm font-bold text-white leading-none">{(course.rating || 5).toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Enrolled</span>
                      <span className="text-sm font-bold text-white leading-none">{(course.students || 0).toLocaleString()} Agents</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-80 flex flex-col justify-center">
                <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Clearance Requirement</span>
                    <div className="text-4xl font-black text-white mb-1">
                      {course.price === "Free" ? "OPEN" : course.price}
                    </div>
                    {course.price === "Free" && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Level 1 Accessible</span>}
                  </div>

                  <EnrollmentStatus
                    enrollment={enrollment}
                    courseId={course.id}
                    onEnroll={(courseId) => enrollMutation.mutate(courseId)}
                    onContinue={() => setIsLearning(true)}
                    loading={enrollMutation.isPending}
                  />
                </Card>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isLearning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                    <iframe
                      src={currentLectures[currentLectureIdx].videoUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <div>
                      <h3 className="text-xl font-black text-white">{currentLectures[currentLectureIdx].title}</h3>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Module {currentLectureIdx + 1} of {currentLectures.length}</p>
                    </div>
                    <Button 
                      onClick={() => setCurrentLectureIdx((prev) => (prev + 1) % currentLectures.length)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest px-6"
                    >
                      Next Video
                    </Button>
                  </div>
                </div>
                <Card className="bg-slate-900/40 border-white/5 rounded-3xl overflow-hidden self-start">
                  <div className="p-6 border-b border-white/5 bg-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-blue-500" />
                      Video Lectures
                    </h4>
                  </div>
                  <div className="p-2 space-y-1">
                    {currentLectures.map((lecture, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentLectureIdx(idx)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                          idx === currentLectureIdx ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                          idx === currentLectureIdx ? 'bg-blue-500 text-white' : 'bg-slate-800'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold truncate">{lecture.title}</p>
                          <p className="text-[10px] uppercase font-black opacity-50">{lecture.duration}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            {/* Intel Breakdown */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Tactical Objectives
                </h2>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(course.topics) && course.topics.map((topic: string, index: number) => (
                  <Card key={index} className="bg-slate-900/40 border-white/5 p-5 rounded-2xl flex items-center gap-4 group hover:bg-slate-900/60 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{topic}</span>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Curriculum Timeline */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-purple-500" />
                  Course Curriculum
                </h2>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/10 text-slate-500">
                  {lessons.length} Modules Detected
                </Badge>
              </div>

              <div className="space-y-4">
                {lessonsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />
                  ))
                ) : lessons.length > 0 ? (
                  lessons.map((lesson, index) => (
                    <MotionCard
                      key={lesson.id}
                      variants={itemVariants}
                      whileHover={{ x: 6 }}
                      onClick={() => setLocation(`/course/${course.id}/lesson/${lesson.id}`)}
                      className="group bg-slate-900/40 border-white/5 hover:border-blue-500/20 hover:bg-slate-900/60 rounded-2xl overflow-hidden p-5 transition-all relative cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/5 flex flex-col items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600 mb-0.5">MOD</span>
                            <span className="text-base font-black leading-none">{lesson.order}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors leading-tight">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1.5">
                              {lesson.duration && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  <Clock className="h-3.3 w-3.5" />
                                  {lesson.duration}m duration
                                </span>
                              )}
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-500/60 transition-colors">
                                <Play className="h-3 w-3 fill-current" />
                                Protocol Active
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="icon" className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl group/btn">
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                        </Button>
                      </div>
                    </MotionCard>
                  ))
                ) : (
                  <Card className="bg-slate-900/40 border-white/5 p-16 text-center rounded-3xl">
                    <Shield className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Full tactical briefing modules are currently being encrypted. Check back in 24h.</p>
                  </Card>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <MotionCard variants={itemVariants} className="bg-slate-900/40 border-white/5 rounded-3xl p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 rounded-full" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Intel Specs</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operative Level</span>
                    <Badge variant="outline" className={`rounded-lg border-white/5 ${getLevelColor(course.level)} text-[10px] font-black uppercase`}>
                      {course.level}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Complexity</span>
                    <span className="text-xs font-bold text-slate-300">{course.difficulty}</span>
                  </div>
                  {course.prerequisites && (
                    <div className="pt-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Pre-requisites Required</span>
                      <p className="text-xs font-semibold text-slate-400 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        {course.prerequisites}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </MotionCard>

            <MotionCard variants={itemVariants} className="bg-emerald-500/5 border-emerald-500/10 rounded-3xl p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-5 w-5 text-emerald-500" />
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Protocol Completion</h4>
                </div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  Finish all modules in this module to earn a <strong>Command Certificate</strong> and unlock <strong>Sector 7</strong> access.
                </p>
              </div>
            </MotionCard>
          </div>
        </div>
      </motion.div>
    </PageTransition>
  );
}