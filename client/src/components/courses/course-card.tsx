import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/ui/card";
import { Users, Clock, Star, BookOpen, GraduationCap, DollarSign, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EnrollmentStatus } from "./enrollment-status";
import type { Enrollment, Course } from "@shared/schema";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<Enrollment>({
    queryKey: ["/api/users", userId, "courses", course.id, "enrollment"],
    retry: false,
    enabled: !!userId,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("POST", `/api/courses/${courseId}/enroll`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "courses", course.id, "enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
  });

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "intermediate": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "advanced": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <MotionCard
      whileHover={{ y: -5, scale: 1.02 }}
      className="group flex flex-col h-full bg-slate-900/40 border-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl relative"
    >
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-6 flex flex-col h-full z-10">
        <div className="flex justify-between items-start mb-4">
          <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getLevelColor(course.level)}`}>
            {course.level}
          </Badge>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black text-white">{course.rating}.0</span>
          </div>
        </div>

        <div className="flex-grow mb-6">
          <h3 className="text-lg font-black text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-slate-600" />
              {(course.students ?? 0).toLocaleString()} Cadets
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-slate-600" />
              {course.duration}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(course.topics as string[] || []).slice(0, 3).map((topic: string, i: number) => (
              <span key={i} className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                {topic}
              </span>
            ))}
            {(course.topics as string[] || []).length > 3 && (
              <span className="text-[9px] font-bold text-slate-600 px-1 py-0.5">
                +{(course.topics as string[]).length - 3}
              </span>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pricing</span>
              <span className={`text-sm font-black ${course.price === "Free" ? 'text-emerald-400' : 'text-white'}`}>
                {course.price === "Free" ? "FREE ACCESS" : course.price}
              </span>
            </div>

            <Link href={`/course/${course.id}`}>
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                Intelligence
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="pt-1">
            <EnrollmentStatus
              enrollment={enrollment}
              courseId={course.id}
              onEnroll={(courseId) => enrollMutation.mutate(courseId)}
              onContinue={(courseId) => setLocation(`/course/${courseId}?learning=true`)}
              loading={enrollmentLoading || enrollMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Subtle Glow */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/10 blur-[50px] pointer-events-none" />
    </MotionCard>
  );
}