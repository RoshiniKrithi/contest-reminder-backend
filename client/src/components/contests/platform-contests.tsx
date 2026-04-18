import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ExternalLink, Users, ArrowLeft, Timer } from 'lucide-react';
import { SiCodeforces, SiLeetcode, SiCodechef } from 'react-icons/si';
import { Link, useLocation } from 'wouter';

interface Contest {
  id: string;
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  status: string;
}

const platformInfo = {
  'codeforces.com': {
    name: 'Codeforces',
    icon: SiCodeforces,
    color: 'bg-blue-500 hover:bg-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  'leetcode.com': {
    name: 'LeetCode',
    icon: SiLeetcode,
    color: 'bg-orange-500 hover:bg-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  'codechef.com': {
    name: 'CodeChef',
    icon: SiCodechef,
    color: 'bg-yellow-600 hover:bg-yellow-700',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  'hackerrank.com': {
    name: 'HackerRank',
    icon: () => <div className="w-5 h-5 bg-current rounded font-bold text-xs flex items-center justify-center text-center leading-none">HR</div>,
    color: 'bg-green-600 hover:bg-green-700',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  'geeksforgeeks.org': {
    name: 'GeeksforGeeks',
    icon: () => <div className="w-5 h-5 bg-current rounded font-bold text-xs flex items-center justify-center text-center leading-none">GfG</div>,
    color: 'bg-green-700 hover:bg-green-800',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  'codingninjas.com': {
    name: 'Coding Ninjas',
    icon: () => <div className="w-5 h-5 bg-current rounded font-bold text-xs flex items-center justify-center text-center leading-none">CN</div>,
    color: 'bg-purple-600 hover:bg-purple-700',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
};

export default function PlatformContests() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: contests, isLoading } = useQuery({
    queryKey: ['/api/external-contests'],
    refetchInterval: 300000, // 5 minutes
  });

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

  const getPlatformContestStats = (platform: string) => {
    const platformContests = getContestsForPlatform(platform);
    const liveContests = platformContests.filter(c => c.status === 'live');
    const upcomingContests = platformContests.filter(c => c.status === 'upcoming');
    return { live: liveContests.length, upcoming: upcomingContests.length, total: platformContests.length };
  };

  const getContestsForPlatform = (platform: string) => {
    if (!contests || !Array.isArray(contests)) return [];
    const platformKeywords: Record<string, string[]> = {
      'codeforces.com': ['codeforces'],
      'leetcode.com': ['leetcode'],
      'codechef.com': ['codechef', 'chef'],
      'atcoder.jp': ['atcoder'],
      'hackerrank.com': ['hackerrank'],
      'geeksforgeeks.org': ['geeksforgeeks', 'gfg'],
      'codingninjas.com': ['coding ninjas', 'codingninjas'],
      'codebyte.com': ['codebyte', 'coderbyte'],
      'topcoder.com': ['topcoder'],
      'hackerearth.com': ['hackerearth']
    };

    const keywords = platformKeywords[platform] || [platform];
    
    return contests.filter((contest: Contest) => 
      keywords.some((keyword: string) => 
        (contest.site && contest.site.toLowerCase().includes(keyword.toLowerCase())) ||
        (contest.url && contest.url.toLowerCase().includes(keyword.toLowerCase())) ||
        (contest.name && contest.name.toLowerCase().includes(keyword.toLowerCase()))
      )
    ).filter((contest: Contest) => 
      contest.status === 'upcoming' || contest.status === 'live'
    );
  };

  // Separate platforms into two groups
  const mainPlatforms = ['codeforces.com', 'leetcode.com', 'codechef.com', 'hackerrank.com'];
  const centeredPlatforms = ['geeksforgeeks.org', 'codingninjas.com'];

  const renderPlatformCard = (platform: string) => {
    const info = platformInfo[platform as keyof typeof platformInfo];
    const stats = getPlatformContestStats(platform);
    const Icon = info.icon;
    
    return (
      <div key={platform} className="space-y-2">
        <Button
          onClick={() => setSelectedPlatform(platform)}
          className={`${info.color} text-white h-auto py-4 px-6 flex flex-col items-center gap-2 relative w-full btn-animate`}
          data-testid={`button-platform-${platform.replace('.', '-')}`}
        >
          <Icon />
          <span className="font-medium text-sm text-white">{info.name}</span>
          <div className="flex gap-1 text-xs">
            {stats.live > 0 && (
              <Badge variant="secondary" className="bg-red-500/20 text-white border-red-300">
                {stats.live} Live
              </Badge>
            )}
            {stats.upcoming > 0 && (
              <Badge variant="secondary" className="bg-blue-500/20 text-white border-blue-300">
                {stats.upcoming} Upcoming
              </Badge>
            )}
            {stats.total === 0 && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                No contests
              </Badge>
            )}
          </div>
        </Button>
        <div className="text-center">
          <a 
            href={`https://${platform}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-white hover:text-white transition-colors inline-flex items-center gap-1"
            data-testid={`link-platform-${platform.replace('.', '-')}`}
          >
            <ExternalLink className="h-3 w-3" />
            Visit {info.name}
          </a>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-black text-white min-h-screen p-6">
      {/* Platform Selection */}
      <div className="space-y-6">
        {/* Main platforms grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mainPlatforms.map(renderPlatformCard)}
        </div>
        
        {/* Centered platforms below */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {centeredPlatforms.map(renderPlatformCard)}
          </div>
        </div>
      </div>

      {/* Selected Platform Contests */}
      {selectedPlatform && (
        <div className="space-y-6">
          <div className="text-center py-6 border-b border-gray-600">
            <div className="flex items-center justify-center gap-3 mb-3">
              {React.createElement(platformInfo[selectedPlatform as keyof typeof platformInfo].icon)}
              <h2 className="text-3xl font-bold text-white">
                {platformInfo[selectedPlatform as keyof typeof platformInfo].name}
              </h2>
            </div>
            <div className="flex items-center justify-center gap-6 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white">
                  {getPlatformContestStats(selectedPlatform).live} Live Contests
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-white">
                  {getPlatformContestStats(selectedPlatform).upcoming} Upcoming Contests
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedPlatform(null)}
                className="text-white hover:text-white"
                data-testid="button-back-to-platforms"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Platforms
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
                data-testid={`button-visit-${selectedPlatform.replace('.', '-')}`}
              >
                <a href={`https://${selectedPlatform}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visit {platformInfo[selectedPlatform as keyof typeof platformInfo].name}
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {getContestsForPlatform(selectedPlatform).map((contest: Contest) => {
              const info = platformInfo[selectedPlatform as keyof typeof platformInfo];
              const startTime = formatDateTime(contest.start_time);
              const endTime = formatDateTime(contest.end_time);
              const isLive = contest.status === 'live';

              const platformKey = selectedPlatform === 'codeforces.com' ? 'codeforces' : 
                                 selectedPlatform === 'leetcode.com' ? 'leetcode' : 
                                 selectedPlatform === 'codechef.com' ? 'codechef' : 
                                 selectedPlatform === 'hackerrank.com' ? 'hackerrank' : 
                                 selectedPlatform === 'geeksforgeeks.org' ? 'geeksforgeeks' : 
                                 selectedPlatform === 'codingninjas.com' ? 'codingninjas' : 'codeforces';

              return (
                <Card 
                  key={contest.id}
                  className={`${info.bgColor} ${info.borderColor} border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                  data-testid={`contest-card-${contest.id}`}
                  onClick={() => setLocation(`/platform/${platformKey}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-xl font-bold leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">
                        {contest.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isLive && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-white tracking-wide">LIVE</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                        <Calendar className="h-5 w-5 text-white flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white">{startTime.date}</p>
                          <p className="text-xs text-white">{startTime.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                        <Clock className="h-5 w-5 text-white flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white">{formatDuration(contest.duration)}</p>
                          <p className="text-xs text-white">Duration</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contest Status and Progress */}
                    {isLive ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">Contest Progress</span>
                          <span className="font-medium text-white">
                            {Math.round(getContestProgress(contest.start_time, contest.end_time))}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${getContestProgress(contest.start_time, contest.end_time)}%` }}
                          />
                        </div>
                        <p className="text-xs text-white text-center">
                          Ends: {endTime.date} at {endTime.time}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">Starts in</span>
                          <div className="flex items-center gap-1">
                            <Timer className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-white">
                              {getTimeUntilContest(contest.start_time)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-white text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="font-medium">Reminder:</span> Set up notifications to not miss this contest!
                        </div>
                      </div>
                    )}
                    
                    {/* Contest Details */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="flex items-center justify-between text-xs text-white">
                        <span>Hosted by {info.name}</span>
                        <span className={`px-2 py-1 rounded-full ${isLive ? 'bg-red-100 text-white dark:bg-red-900' : 'bg-blue-100 text-white dark:bg-blue-900'}`}>
                          {isLive ? 'LIVE NOW' : 'UPCOMING'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className={`w-full ${info.color} text-white font-semibold py-3 hover:shadow-lg transition-all duration-200 hover:scale-105`}
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(contest.url, '_blank');
                      }}
                      data-testid={`button-participate-${contest.id}`}
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      {isLive ? 'Join Contest Now' : 'View Contest Details'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!selectedPlatform && (
        <div className="text-center py-12">
          <div className="mb-6">
            <Users className="h-16 w-16 text-white mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-white">Discover Programming Contests</h3>
            <p className="text-white max-w-md mx-auto">
              Click on any platform above to view live and upcoming contests. Get direct access to participate in competitions across all major coding platforms.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm text-white">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <p className="text-white">Real-time Updates</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
              <p className="text-white">Direct Links</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <p className="text-white">Contest Schedule</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <p className="text-white">Multiple Platforms</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}