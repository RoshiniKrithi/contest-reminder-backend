import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, eachDayOfInterval, startOfToday, parseISO, getDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { UserActivity } from "@shared/schema";

export default function ActivityHeatmap() {
    const { data: activity, isLoading } = useQuery<UserActivity[]>({
        queryKey: ["/api/user/activity"],
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Generate last 365 days
    const today = startOfToday();
    const startDate = subDays(today, 364); // Last year
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Map activity to dictionary for O(1) lookup
    const activityMap = new Map<string, { minutesActive: number; questionsSolved: number }>();
    activity?.forEach(a => {
        // Use local date string to match format() calls
        const localDate = new Date(a.date);
        const dateStr = format(localDate, 'yyyy-MM-dd');

        const existing = activityMap.get(dateStr) || { minutesActive: 0, questionsSolved: 0 };
        activityMap.set(dateStr, {
            minutesActive: existing.minutesActive + (a.minutesActive || 0),
            questionsSolved: existing.questionsSolved + (a.questionsSolved || 0)
        });
    });

    // Improved contrast colors with vibrant highlight effects
    const getIntensityColor = (questions: number) => {
        if (questions === 0) return "bg-gray-800/30 border border-gray-800/50"; // Subtler empty cell
        if (questions <= 2) return "bg-emerald-900 border border-emerald-800/50 shadow-[0_0_5px_rgba(6,78,59,0.3)]";
        if (questions <= 5) return "bg-emerald-600 border border-emerald-500/50 shadow-[0_0_8px_rgba(5,150,105,0.4)]";
        if (questions <= 10) return "bg-emerald-400 border border-white/20 shadow-[0_0_12px_rgba(52,211,153,0.5)]";
        return "bg-emerald-300 border border-white/40 shadow-[0_0_15px_rgba(110,231,183,0.8)]";
    };

    // Group days by weeks for the grid
    // We need to align start date to Sunday/Monday depending on preference
    // Let's create a grid where each column is a week

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
        if (getDay(day) === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
        if (index === days.length - 1 && currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
    });

    // Calculate stats
    const totalQuestions = activity?.reduce((acc, curr) => acc + (curr.questionsSolved || 0), 0) || 0;
    const totalMinutes = activity?.reduce((acc, curr) => acc + (curr.minutesActive || 0), 0) || 0;

    // Calculate current streak
    let currentStreak = 0;
    let streakDate = today;

    while (true) {
        const dateStr = format(streakDate, 'yyyy-MM-dd');
        if (activityMap.has(dateStr)) {
            currentStreak++;
            streakDate = subDays(streakDate, 1);
        } else {
            break;
        }
    }

    // Consolidated 'Main Card' design
    // Use w-fit and mx-auto to ensure the card fits perfectly around its content and is centered
    // Increased padding on the outer container to force "equal gap" and reduce perceived inner box size
    return (
        <div className="w-full flex justify-center py-6 px-4">
            <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-8 flex flex-col items-center gap-6 w-fit mx-auto backdrop-blur-sm shadow-2xl">

                {/* Stats Row - Centered and evenly spaced */}
                <div className="flex flex-wrap justify-center gap-10 md:gap-16 pb-6 border-b border-gray-800/50 w-full px-6">
                    <div className="flex flex-col items-center group cursor-default">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 group-hover:text-blue-400 transition-colors">Total Solved</span>
                        <span className="text-3xl font-black text-white tracking-tight group-hover:scale-110 transition-transform duration-300">{totalQuestions}</span>
                    </div>

                    {/* Vertical Divider (Hidden on mobile) */}
                    <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-gray-800 to-transparent" />

                    <div className="flex flex-col items-center group cursor-default">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 group-hover:text-purple-400 transition-colors">Active Time</span>
                        <span className="text-3xl font-black text-white tracking-tight group-hover:scale-110 transition-transform duration-300">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
                    </div>

                    {/* Vertical Divider (Hidden on mobile) */}
                    <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-gray-800 to-transparent" />

                    <div className="flex flex-col items-center group cursor-default">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 group-hover:text-green-400 transition-colors">Current Streak</span>
                        <span className="text-3xl font-black text-white tracking-tight group-hover:scale-110 transition-transform duration-300">{currentStreak} <span className="text-sm font-medium text-gray-600">days</span></span>
                    </div>
                </div>

                {/* Heatmap Section */}
                <div className="flex flex-col items-center gap-5 w-full px-2">
                    {/* Grid Container - strictly centered with w-fit */}
                    <div className="overflow-x-auto pb-2 scrollbar-hide flex justify-center w-full">
                        <div className="flex gap-[3px] mx-auto">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIndex) => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const dayActivity = activityMap.get(dateStr);
                                        const questions = dayActivity?.questionsSolved || 0;

                                        return (
                                            <TooltipProvider key={dateStr}>
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`w-2 h-2 rounded-[1.5px] ${getIntensityColor(questions)} transition-all duration-300 hover:scale-150 hover:z-10`}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-gray-900 border-gray-800 text-xs shadow-xl p-2 z-50">
                                                        <div className="text-center">
                                                            <div className="font-bold text-white mb-0.5">{questions} problems</div>
                                                            <div className="text-gray-400">{format(day, 'MMM d, yyyy')}</div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 bg-gray-900/40 px-3 py-1.5 rounded-full border border-gray-800/50">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-600">Less</span>
                        <div className="flex gap-[3px]">
                            <div className="w-2 h-2 rounded-[1px] bg-gray-800/30 border border-gray-800/50" />
                            <div className="w-2 h-2 rounded-[1px] bg-emerald-900 border border-emerald-800/50 shadow-[0_0_5px_rgba(6,78,59,0.3)]" />
                            <div className="w-2 h-2 rounded-[1px] bg-emerald-600 border border-emerald-500/50 shadow-[0_0_8px_rgba(5,150,105,0.4)]" />
                            <div className="w-2 h-2 rounded-[1px] bg-emerald-400 border border-white/20 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                            <div className="w-2 h-2 rounded-[1px] bg-emerald-300 border border-white/40 shadow-[0_0_15px_rgba(110,231,183,1)]" />
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-600">More</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
