import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { UserActivity, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { Link, useRoute } from "wouter";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

export default function AdminUserDetail() {
    const [, params] = useRoute("/admin/users/:id");
    const userId = params?.id;

    const { data: activity } = useQuery<UserActivity[]>({
        queryKey: [`/api/admin/users/${userId}/activity`],
        enabled: !!userId,
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        enabled: !!userId,
    });

    const user = users?.find(u => u.id === userId);

    // Process data
    const totalMinutes = activity?.reduce((acc, curr) => acc + (curr.minutesActive || 0), 0) || 0;
    const totalQuestions = activity?.reduce((acc, curr) => acc + (curr.questionsSolved || 0), 0) || 0;
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Format data for charts
    const chartData = activity?.map(a => ({
        date: new Date(a.date).toLocaleDateString(),
        minutes: a.minutesActive || 0,
        questions: a.questionsSolved || 0,
    })).reverse() || []; // Reverse assuming API returns newest first

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                    <Link href="/admin/dashboard">
                        <Button variant="outline" size="icon" className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{user?.username || 'User Details'}</h2>
                        <p className="text-slate-500">Performance Overview</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Hours</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalHours}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                Lifetime activity
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Questions Solved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalQuestions}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                Completed problems
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Streak</CardTitle>
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5 Days</div>
                            <p className="text-xs text-slate-500 mt-1">
                                Current active streak
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Joined</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Dec 2024</div>
                            <p className="text-xs text-slate-500 mt-1">
                                Member since
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Activity (Minutes)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="date" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                        />
                                        <Area type="monotone" dataKey="minutes" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMinutes)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    No activity data recorded yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Questions Solved</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="date" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                        />
                                        <Bar dataKey="questions" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    No questions solved yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
