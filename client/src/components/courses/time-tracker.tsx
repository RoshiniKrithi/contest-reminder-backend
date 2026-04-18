import { useState, useEffect } from "react";
import { Clock, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeTrackerProps {
  onTimeUpdate: (timeSpent: number) => void;
  initialTime?: number;
  autoStart?: boolean;
  className?: string;
}

export function TimeTracker({ 
  onTimeUpdate, 
  initialTime = 0, 
  autoStart = false,
  className = "" 
}: TimeTrackerProps) {
  const [timeSpent, setTimeSpent] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
        const newTimeSpent = initialTime + elapsedMinutes;
        setTimeSpent(newTimeSpent);
        onTimeUpdate(newTimeSpent);
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime, initialTime, onTimeUpdate]);

  const handleStart = () => {
    setStartTime(new Date());
    setIsRunning(true);
  };

  const handlePause = () => {
    if (startTime) {
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      const newTimeSpent = Math.max(initialTime + elapsedMinutes, timeSpent);
      setTimeSpent(newTimeSpent);
      onTimeUpdate(newTimeSpent);
    }
    setIsRunning(false);
    setStartTime(null);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Clock className="w-4 h-4" />
        <span data-testid="time-display">{formatTime(timeSpent)}</span>
        {isRunning && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Active
          </span>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={isRunning ? handlePause : handleStart}
        className="h-8"
        data-testid={isRunning ? "button-pause" : "button-start"}
      >
        {isRunning ? (
          <>
            <Pause className="w-3 h-3 mr-1" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-3 h-3 mr-1" />
            Start
          </>
        )}
      </Button>
    </div>
  );
}