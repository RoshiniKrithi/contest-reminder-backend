import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({ 
  progress, 
  className = "", 
  showPercentage = true,
  size = "md" 
}: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <Progress 
          value={progress} 
          className={`w-full ${sizeClasses[size]}`}
          data-testid="progress-bar"
        />
      </div>
      {showPercentage && (
        <span 
          className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[3rem] text-right"
          data-testid="progress-percentage"
        >
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}