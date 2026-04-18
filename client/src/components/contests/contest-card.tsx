import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/ui/card";
import { Users, Clock, Calendar, Hourglass, Globe, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface ContestCardProps {
  contest: {
    id: string;
    name?: string; // External contest field
    title?: string; // Internal contest field
    platform?: string; // External contest field
    status: string;
    participants?: number; // Optional for external contests
    startTime?: string; // Internal contest field
    endTime?: string; // Internal contest field
    start_time?: string; // External contest field
    end_time?: string; // External contest field
    url?: string; // External contest field
    duration?: number; // External contest field in minutes
  };
}

export default function ContestCard({ contest }: ContestCardProps) {
  const isLive = contest.status === "live";
  const isUpcoming = contest.status === "upcoming";

  const contestTitle = contest.title || contest.name || "Untitled Contest";
  const startTime = contest.startTime || contest.start_time;
  const endTime = contest.endTime || contest.end_time;

  const getTimeInfo = () => {
    if (!startTime || !endTime) return "";

    const now = new Date();
    const end = new Date(endTime);

    if (isLive) {
      const timeLeft = end.getTime() - now.getTime();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return `Ends in ${hours}h ${minutes}m`;
    }
    return "";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDurationInfo = () => {
    if (contest.duration) {
      const hours = Math.floor(contest.duration / 60);
      const mins = contest.duration % 60;
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    }
    return "";
  };

  return (
    <MotionCard
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative overflow-hidden border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl h-full flex flex-col"
    >
      {/* Visual Accents */}
      <div className={`absolute top-0 left-0 w-1 h-full ${isLive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : isUpcoming ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />

      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/5 rounded-lg">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {contest.platform || "Platform"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
              {contestTitle}
            </h3>
          </div>
          <Badge
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border-transparent ${isLive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : isUpcoming
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                  : "bg-slate-800 text-slate-400"
              }`}
          >
            {contest.status}
          </Badge>
        </div>

        <div className="space-y-3 mb-6 flex-grow">
          {/* Metrics */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
            <div className="flex items-center gap-1.5">
              <Hourglass className="h-3.5 w-3.5 text-slate-500" />
              {getDurationInfo() || "N/A"}
            </div>
            {isLive ? (
              <div className="flex items-center gap-1.5 text-emerald-400 animate-pulse">
                <Clock className="h-3.5 w-3.5" />
                {getTimeInfo()}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {startTime ? formatDateTime(startTime) : "TBD"}
              </div>
            )}
          </div>

          {contest.participants !== undefined && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Users className="h-3.5 w-3.5" />
              {contest.participants.toLocaleString()} Enrolled
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          {contest.url ? (
            <a href={contest.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                variant="default"
                size="sm"
                className={`w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl transition-all shadow-lg ${isLive
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                  }`}
              >
                {isLive ? "Initiate Uplink" : "View Intelligence"}
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </Button>
            </a>
          ) : (
            <Link href={`/contest/${contest.id}`} className="flex-1">
              <Button
                variant="default"
                size="sm"
                className="w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
              >
                {isLive ? "Begin Operation" : "Register Units"}
                <ShieldCheck className="h-3.5 w-3.5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Glow Effect */}
      <div className={`absolute -bottom-10 -right-10 w-24 h-24 blur-[60px] opacity-20 pointer-events-none rounded-full ${isLive ? 'bg-emerald-500' : 'bg-blue-500'}`} />
    </MotionCard>
  );
}


