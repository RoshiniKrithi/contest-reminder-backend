import axios from "axios";

// Define production-grade contest data types
export interface Contest {
  id: string;
  title: string;
  platform: string;
  url: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in minutes
  status: "upcoming" | "ongoing" | "past";
  externalId?: string;
}

// Famous competitive programming platforms — only these are shown
export const ALLOWED_PLATFORMS = new Set([
  "codeforces.com",
  "leetcode.com",
  "codechef.com",
  "atcoder.jp",
  "hackerrank.com",
  "geeksforgeeks.org",
  "topcoder.com",
  "hackerearth.com",
  "codingninjas.com",
  // Normalised names used by CodeforcesAPI / LeetCodeAPI
  "Codeforces",
  "LeetCode",
  "CodeChef",
  "AtCoder",
  "HackerRank",
  "GeeksforGeeks",
  "TopCoder",
  "HackerEarth",
  "Coding Ninjas",
]);

export function isAllowedPlatform(platform: string): boolean {
  if (!platform) return false;
  const p = platform.toLowerCase();
  return (
    ALLOWED_PLATFORMS.has(platform) ||          // exact match
    p.includes("codeforces") ||
    p.includes("leetcode") ||
    p.includes("codechef") ||
    p.includes("atcoder") ||
    p.includes("hackerrank") ||
    p.includes("geeksforgeeks") ||
    p.includes("topcoder") ||
    p.includes("hackerearth") ||
    p.includes("codingninjas") ||
    p.includes("coding ninjas")
  );
}
export class ClistAPI {
  private static readonly BASE_URL = "https://clist.by/api/v2/contest/";
  private static readonly USERNAME = process.env.CLIST_USERNAME || "demo";
  private static readonly API_KEY = process.env.CLIST_API_KEY || "";

  static async getContests(): Promise<Contest[]> {
    if (!this.API_KEY || this.API_KEY === "") {
      console.warn("[ClistAPI] API Key missing. Falling back to other sources.");
      return [];
    }

    try {
      const response = await axios.get(this.BASE_URL, {
        params: {
          username: this.USERNAME,
          api_key: this.API_KEY,
          format: "json",
          start__gte: new Date().toISOString(),
          order_by: "start",
          limit: 200,
          // Only fetch from famous competitive programming platforms
          resource__name__in: [
            "codeforces.com",
            "leetcode.com",
            "codechef.com",
            "atcoder.jp",
            "hackerrank.com",
            "geeksforgeeks.org",
            "topcoder.com",
            "hackerearth.com",
            "codingninjas.com",
          ].join(","),
        },
        timeout: 15000
      });

      if (response.data && response.data.objects) {
        return response.data.objects.map((contest: any) => {
          const startTime = new Date(contest.start);
          const endTime = new Date(contest.end);
          const now = new Date();
          
          let status: "upcoming" | "ongoing" | "past" = "upcoming";
          if (now < startTime) status = "upcoming";
          else if (now >= startTime && now <= endTime) status = "ongoing";
          else status = "past";

          return {
            id: `clist-${contest.id}`,
            title: contest.event,
            platform: typeof contest.resource === 'object' ? contest.resource.name : contest.resource,
            url: contest.href,
            startTime: contest.start,
            endTime: contest.end,
            duration: Math.round(contest.duration / 60),
            status,
            externalId: contest.id.toString()
          };
        });
      }
      return [];
    } catch (error) {
      console.error("[ClistAPI] Error fetching contests:", error);
      return [];
    }
  }
}

// LeetCode API integration (Backup)
export class LeetCodeAPI {
  private static readonly GRAPHQL_URL = "https://leetcode.com/graphql";
  
  static async getContests(): Promise<Contest[]> {
    try {
      const response = await axios.post(this.GRAPHQL_URL, {
        query: `
          {
            allContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.data && response.data.data && response.data.data.allContests) {
        const now = Math.floor(Date.now() / 1000);
        return response.data.data.allContests
          .filter((contest: any) => (contest.startTime + contest.duration) > now)
          .map((contest: any) => {
            const startTime = contest.startTime * 1000;
            const durationMs = contest.duration * 1000;
            return {
              id: `leetcode-${contest.titleSlug}`,
              title: contest.title,
              platform: "LeetCode",
              startTime: new Date(startTime).toISOString(),
              endTime: new Date(startTime + durationMs).toISOString(),
              duration: Math.round(contest.duration / 60),
              url: `https://leetcode.com/contest/${contest.titleSlug}`,
              status: contest.startTime > now ? "upcoming" : "ongoing"
            };
          });
      }
      return [];
    } catch (error) {
      console.error("Error fetching LeetCode contests:", error);
      return [];
    }
  }
}

// Codeforces API integration (Backup)
export class CodeforcesAPI {
  private static readonly BASE_URL = "https://codeforces.com/api";
  
  static async getContests(): Promise<Contest[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/contest.list`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CodeArena Contest Tracker'
        }
      });
      
      if (response.data.status === "OK") {
        return response.data.result
          .filter((contest: any) => contest.phase === "BEFORE" || contest.phase === "CODING")
          .map((contest: any) => ({
            id: `cf-${contest.id}`,
            title: contest.name,
            platform: "Codeforces",
            startTime: new Date(contest.startTimeSeconds * 1000).toISOString(),
            endTime: new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000).toISOString(),
            duration: Math.round(contest.durationSeconds / 60),
            url: `https://codeforces.com/contest/${contest.id}`,
            status: contest.phase === "BEFORE" ? "upcoming" : "ongoing",
            externalId: contest.id.toString()
          }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching Codeforces contests:", error);
      return [];
    }
  }
}

// Universal contest API aggregator (Kontests.net - Backup)
export class KontestsAPI {
  private static readonly BASE_URL = "https://www.kontests.net/api/v1";
  
  static async getAllContests(): Promise<Contest[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/all`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'CodeArena Contest Tracker'
        }
      });
      
      const now = new Date();
      return response.data
        .filter((contest: any) => new Date(contest.end_time) > now)
        .map((contest: any) => ({
          id: `kontest-${contest.site}-${Date.parse(contest.start_time)}`,
          title: contest.name,
          platform: this.normalizePlatform(contest.site),
          startTime: contest.start_time,
          endTime: contest.end_time,
          duration: Math.round((new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime()) / 60000),
          url: contest.url,
          status: new Date(contest.start_time) <= now ? "ongoing" : "upcoming"
        }));
    } catch (error) {
      console.error("Error fetching from Kontests API:", error);
      return [];
    }
  }
  
  private static normalizePlatform(site: string): string {
    const platformMap: { [key: string]: string } = {
      'CodeForces': 'Codeforces',
      'CodeChef': 'CodeChef',
      'LeetCode': 'LeetCode',
      'AtCoder': 'AtCoder',
      'HackerRank': 'HackerRank',
      'TopCoder': 'TopCoder',
      'HackerEarth': 'HackerEarth',
      'Kick Start': 'Google Kick Start',
      'CSAcademy': 'CS Academy',
    };
    return platformMap[site] || site;
  }
}

// Contest aggregator service with intelligent deduplication and caching
export class ContestService {
  private static cache: Contest[] = [];
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

  static async fetchAllContests(force = false): Promise<Contest[]> {
    const now = Date.now();
    
    if (!force && this.cache.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      console.log("[ContestService] Syncing all global contest sources...");
      
      const [clist, codeforces, kontests, leetcode] = await Promise.allSettled([
        ClistAPI.getContests(),
        CodeforcesAPI.getContests(),
        KontestsAPI.getAllContests(),
        LeetCodeAPI.getContests()
      ]);
      
      const contests: Contest[] = [];
      
      if (clist.status === "fulfilled") contests.push(...clist.value);
      if (codeforces.status === "fulfilled") contests.push(...codeforces.value);
      if (kontests.status === "fulfilled") contests.push(...kontests.value);
      if (leetcode.status === "fulfilled") contests.push(...leetcode.value);
      
      // Intelligent deduplication (Primary URL matching + Fuzzy Title matching)
      const uniqueContests = contests.filter((contest, index, self) => 
        index === self.findIndex(c => 
          c.url === contest.url || 
          (c.title === contest.title && c.platform === contest.platform && 
           Math.abs(new Date(c.startTime).getTime() - new Date(contest.startTime).getTime()) < 3600000)
        )
      );
      
      const sortedContests = uniqueContests
        .filter(c => new Date(c.endTime) > new Date()) // ignore finished
        .filter(c => isAllowedPlatform(c.platform))    // only famous platforms
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      if (sortedContests.length > 0) {
        this.cache = sortedContests;
        this.lastFetch = now;
      }

      return sortedContests.length > 0 ? sortedContests : this.cache;
        
    } catch (error) {
      console.error("[ContestService] Sync error:", error);
      return this.cache;
    }
  }
  
  static async getContestsByPlatform(platform: string): Promise<Contest[]> {
    const allContests = await this.fetchAllContests();
    const search = platform.toLowerCase();
    return allContests.filter(contest => 
      contest.platform.toLowerCase().includes(search) ||
      contest.title.toLowerCase().includes(search)
    );
  }
  
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
}

