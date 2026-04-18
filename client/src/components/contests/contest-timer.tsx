import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trophy, Target, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { Contest } from "@shared/schema";

interface ContestTimerProps {
  contest: Contest;
}

export default function ContestTimer({ contest }: ContestTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(0);
  const [isValidDate, setIsValidDate] = useState(true);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const start = new Date(contest.startTime).getTime();

      if (isNaN(end) || isNaN(start)) {
        setIsValidDate(false);
        return;
      }

      setIsValidDate(true);
      const total = end - start;
      const remaining = end - now;

      if (remaining <= 0) {
        setTimeLeft("00:00:00");
        setProgress(100);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );

      const elapsed = now - start;
      const progressPercent = Math.min(Math.max((elapsed / total) * 100, 0), 100);
      setProgress(progressPercent);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [contest.endTime, contest.startTime]);

  const userStats = [
    { label: "Solved", value: "2/4", icon: Target, color: "text-emerald-400" },
    { label: "Rank", value: "#12", icon: Trophy, color: "text-amber-400" },
    { label: "Score", value: "285", icon: Award, color: "text-blue-400" },
  ];

  return (
    <Card className="border-white/5 bg-slate-900/40 relative overflow-hidden group">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-primary animate-pulse" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Mission Clock
          </h3>
        </div>
        <p className="text-lg font-bold text-white truncate">
          {contest.title}
        </p>
      </div>

      <CardContent className="p-6">
        <div className="text-center mb-6">
          <AnimatePresence mode="wait">
            {!isValidDate ? (
              <motion.div
                key="invalid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <Skeleton className="h-10 w-40 bg-white/10" />
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black text-white tracking-widest tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                {timeLeft || <Skeleton className="h-10 w-40 mx-auto bg-white/10" />}
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Time Remaining</p>

          <div className="mt-6 relative">
            <div className="bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
              <span>0%</span>
              <span className="text-white/40">{Math.round(progress)}% DEPLETED</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-6 border-t border-white/5">
          {userStats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-1">
                <stat.icon className={`h-3.5 w-3.5 ${stat.color} opacity-80`} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">{stat.label}</p>
              <p className="text-sm font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

