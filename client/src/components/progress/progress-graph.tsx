import { Card, CardContent, CardHeader, CardTitle, MotionCard } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Trophy, Target, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface ProgressData {
  month: string;
  contestsAttended: number;
  problemsSolved: number;
  averageRating: number;
}

interface ProgressGraphProps {
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-bold text-white">
              {entry.name}: {entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressGraph({ className }: ProgressGraphProps) {
  const { data: progressData, isLoading, error } = useQuery({
    queryKey: ["/api/progress"],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2 text-white font-black tracking-tight">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            Progression Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white/5 h-16 rounded-xl" />
            ))}
          </div>
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !progressData || !Array.isArray(progressData) || progressData.length === 0) {
    return null;
  }

  const latestData = progressData[progressData.length - 1];
  const previousData = progressData[progressData.length - 2];

  const contestsGrowth = previousData ? latestData.contestsAttended - previousData.contestsAttended : 0;
  const problemsGrowth = previousData ? latestData.problemsSolved - previousData.problemsSolved : 0;
  const ratingGrowth = previousData ? latestData.averageRating - previousData.averageRating : 0;

  return (
    <Card className={className}>
      <CardHeader className="p-6">
        <CardTitle className="flex items-center gap-2 text-white font-black tracking-tight">
          <Activity className="h-5 w-5 text-indigo-400" />
          Progression Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 p-6 pt-0">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Contests", value: latestData.contestsAttended, growth: contestsGrowth, icon: Trophy, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Problems", value: latestData.problemsSolved, growth: problemsGrowth, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Rating", value: latestData.averageRating, growth: ratingGrowth, icon: TrendingUp, color: "text-rose-400", bg: "bg-rose-500/10" },
          ].map((metric, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-center mb-1">
                <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">{metric.label}</p>
              <div className="text-lg font-black text-white">{metric.value}</div>
              <div className={`text-[9px] font-bold ${metric.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {metric.growth >= 0 ? '▲' : '▼'} {Math.abs(metric.growth)}
              </div>
            </div>
          ))}
        </div>

        {/* Contest Participation Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Contest Activity
            </h4>
            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">LIVE FEED</span>
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="contestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="contestsAttended"
                  name="Contests"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#contestGradient)"
                  strokeWidth={2}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Rating Chart */}
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
            Rating Velocity
          </h4>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="averageRating"
                  name="Rating"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2, fill: '#ffffff' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}