import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Clock, Play } from "lucide-react";
import { ProgressBar } from "./progress-bar";
import type { Enrollment } from "@shared/schema";

interface EnrollmentStatusProps {
  enrollment?: Enrollment;
  courseId: string;
  onEnroll: (courseId: string) => void;
  onContinue: (courseId: string) => void;
  loading?: boolean;
}

export function EnrollmentStatus({ 
  enrollment, 
  courseId, 
  onEnroll, 
  onContinue,
  loading = false 
}: EnrollmentStatusProps) {
  if (!enrollment) {
    return (
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onEnroll(courseId)}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-enroll"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {loading ? "Enrolling..." : "Enroll Now"}
        </Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (enrollment.status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Play className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
    }
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {getStatusBadge()}
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Time spent: {formatTimeSpent(enrollment.timeSpent || 0)}
        </span>
      </div>
      
      <ProgressBar 
        progress={enrollment.progress || 0} 
        size="md"
        data-testid="enrollment-progress"
      />
      
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onContinue(courseId)}
          disabled={loading || enrollment.status === "completed"}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-continue"
        >
          <Play className="w-4 h-4 mr-2" />
          {enrollment.status === "completed" ? "Review Course" : "Continue Learning"}
        </Button>
        
        {enrollment.completedAt && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Completed on {new Date(enrollment.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}