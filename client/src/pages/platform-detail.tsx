import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/layout/page-transition";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  Clock,
  Calendar,
  Users,
  Check,
  Plus,
  Trophy,
  ArrowLeft,
  Timer
} from "lucide-react";
import {
  SiCodeforces,
  SiLeetcode,
  SiCodechef
} from "react-icons/si";
import { Link } from "wouter";
import ParticlesBackground from "@/components/layout/particles-background";
import { useToast } from "@/hooks/use-toast";

interface Contest {
  id: string;
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  in_24_hours: string;
  status: string;
}

const platformInfo: Record<string, any> = {
  'codeforces': {
    name: 'Codeforces',
    icon: SiCodeforces,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Competitive programming contests and practice problems',
    website: 'https://codeforces.com'
  },
  'leetcode': {
    name: 'LeetCode',
    icon: SiLeetcode,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    description: 'Algorithm and data structure challenges',
    website: 'https://leetcode.com'
  },
  'codechef': {
    name: 'CodeChef',
    icon: SiCodechef,
    color: 'bg-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    description: 'Programming competitions and practice',
    website: 'https://www.codechef.com'
  },
  'hackerrank': {
    name: 'HackerRank',
    icon: () => <div className="w-5 h-5 bg-current rounded font-bold text-xs flex items-center justify-center">HR</div>,
    color: 'bg-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Coding challenges and skill assessments',
    website: 'https://www.hackerrank.com'
  },
  'geeksforgeeks': {
    name: 'GeeksforGeeks',
    icon: () => <div className="w-5 h-5 bg-current rounded font-bold text-xs flex items-center justify-center text-center leading-none">GfG</div>,
    color: 'bg-green-700',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Educational programming contests and challenges',
    website: 'https://www.geeksforgeeks.org'
  },
  'codingninjas': {
    name: 'Coding Ninjas',
    icon: () => <div className="w-5 h-5 bg-current rounded font-bold text-xs flex items-center justify-center text-center leading-none">CN</div>,
    color: 'bg-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Learning-focused programming competitions',
    website: 'https://www.codingninjas.com'
  },
};

export default function PlatformDetail() {
  const [, params] = useRoute("/platform/:platform");
  const platform = params?.platform || '';
  const { toast } = useToast();
  const [attendedContests, setAttendedContests] = useState<Set<string>>(new Set());

  const { data: contests, isLoading } = useQuery({
    queryKey: ['/api/external-contests'],
    refetchInterval: 300000, // 5 minutes
  });

  const info = platformInfo[platform];
  if (!info) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Not Found</h1>
          <Link href="/reminders">
            <Button className="mt-4 btn-animate">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = info.icon;

  const getPlatformContests = () => {
    if (!contests || !Array.isArray(contests)) return [];

    const platformKeywords: Record<string, string[]> = {
      'codeforces': ['codeforces'],
      'leetcode': ['leetcode'],
      'codechef': ['codechef', 'chef'],
      'hackerrank': ['hackerrank'],
      'geeksforgeeks': ['geeksforgeeks', 'gfg'],
      'codingninjas': ['coding ninjas', 'codingninjas']
    };

    const keywords = platformKeywords[platform] || [platform];

    return contests.filter((contest: Contest) =>
      keywords.some((keyword: string) =>
        (contest.site && contest.site.toLowerCase().includes(keyword.toLowerCase())) ||
        (contest.url && contest.url.toLowerCase().includes(keyword.toLowerCase())) ||
        (contest.name && contest.name.toLowerCase().includes(keyword.toLowerCase()))
      )
    );
  };

  const platformContests = getPlatformContests();
  const liveContests = platformContests.filter((contest: Contest) => contest.status === 'live');
  const upcomingContests = platformContests.filter((contest: Contest) => contest.status === 'upcoming');
  const pastContests = platformContests.filter((contest: Contest) => contest.status === 'past');

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatDuration = (duration: string) => {
    const hours = parseInt(duration) / 3600;
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const getTimeUntilContest = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) return "Started";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  const getContestProgress = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const handleAttendContest = (contestId: string) => {
    const newAttended = new Set(attendedContests);
    if (newAttended.has(contestId)) {
      newAttended.delete(contestId);
      toast({
        title: "Attendance Removed",
        description: "Contest attendance has been unmarked",
      });
    } else {
      newAttended.add(contestId);
      toast({
        title: "Attendance Marked",
        description: "Contest attendance has been marked",
      });
    }
    setAttendedContests(newAttended);
  };

  const ContestCard = ({ contest, showAttendance = false }: { contest: Contest, showAttendance?: boolean }) => {
    const isAttended = attendedContests.has(contest.id);
    const datetime = formatDateTime(contest.start_time);
    const endTime = formatDateTime(contest.end_time);
    const isLive = contest.status === 'live';
    const isUpcoming = contest.status === 'upcoming';

    return (
      <Card className={`${info?.bgColor} ${info?.borderColor} border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group`} data-testid={`contest-card-${contest.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant={isLive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                {isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Past'}
              </Badge>
              {isLive && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-300 tracking-wide">LIVE</span>
                </div>
              )}
            </div>
            {showAttendance && (
              <Button
                size="sm"
                variant={isAttended ? "default" : "outline"}
                onClick={() => handleAttendContest(contest.id)}
                className="btn-animate"
                data-testid={`button-attend-${contest.id}`}
              >
                {isAttended ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Attended
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Mark Attended
                  </>
                )}
              </Button>
            )}
          </div>
          <CardTitle className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-2">{contest.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{datetime.date}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{datetime.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{formatDuration(contest.duration)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
              </div>
            </div>
          </div>

          {/* Contest Status and Progress */}
          {isLive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Contest Progress</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Math.round(getContestProgress(contest.start_time, contest.end_time))}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getContestProgress(contest.start_time, contest.end_time)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Ends: {endTime.date} at {endTime.time}
              </p>
            </div>
          ) : isUpcoming ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Starts in</span>
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getTimeUntilContest(contest.start_time)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="font-medium">Reminder:</span> Set up notifications to not miss this contest!
              </div>
            </div>
          ) : null}

          {/* Contest Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Hosted by {info?.name}</span>
              <span className={`px-2 py-1 rounded-full ${isLive ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : isUpcoming ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                {isLive ? 'LIVE NOW' : isUpcoming ? 'UPCOMING' : 'COMPLETED'}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              className={`flex-1 ${info?.color || 'bg-gray-600'} text-white font-semibold py-3 hover:shadow-lg transition-all duration-200 hover:scale-105`}
              onClick={() => window.open(contest.url, '_blank')}
              data-testid={`button-join-${contest.id}`}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isLive ? 'Join Contest Now' : isUpcoming ? 'View Contest Details' : 'View Results'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageTransition>
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Particle Background */}
        <ParticlesBackground />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/reminders">
              <Button variant="outline" size="sm" className="btn-animate" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${info.color} text-white`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{info.name}</h1>
                <p className="text-gray-600 dark:text-gray-400">{info.description}</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => window.open(info.website, '_blank')}
            className="btn-animate"
            data-testid="button-visit-platform"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit {info.name}
          </Button>
        </div>

        {/* Contest Tabs */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="data-[state=active]:bg-secondary data-[state=active]:text-white">
              Live Contests ({liveContests.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Upcoming ({upcomingContests.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-accent data-[state=active]:text-white">
              Recent Past ({pastContests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Live Contests</h2>
              {liveContests.length > 0 && (
                <Badge variant="default" className="bg-secondary">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  {liveContests.length} Active
                </Badge>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : liveContests.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Live Contests</h3>
                <p className="text-gray-600 dark:text-gray-400">There are no live contests on {info.name} at the moment.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} showAttendance={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upcoming Contests</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingContests.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Upcoming Contests</h3>
                <p className="text-gray-600 dark:text-gray-400">No upcoming contests are scheduled on {info.name}.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} showAttendance={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Past Contests</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastContests.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Past Contests</h3>
                <p className="text-gray-600 dark:text-gray-400">No past contests found for {info.name}.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} showAttendance={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}