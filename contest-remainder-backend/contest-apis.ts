import axios from "axios";

export interface Contest {
  id: string;
  name: string;
  platform: string;
  start_time: string;
  end_time: string;
  duration: number;
  url: string;
  status: "upcoming" | "live" | "completed";
}

export class CodeforcesAPI {
  private static readonly BASE_URL = "https://codeforces.com/api";

  static async getContests(): Promise<Contest[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/contest.list`, {
        timeout: 10000,
        headers: { "User-Agent": "CodeArena Contest Tracker" },
      });
      if (response.data.status === "OK") {
        return response.data.result
          .filter((c: any) => c.phase === "BEFORE" || c.phase === "CODING")
          .slice(0, 20)
          .map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            platform: "Codeforces",
            start_time: new Date(c.startTimeSeconds * 1000).toISOString(),
            end_time: new Date((c.startTimeSeconds + c.durationSeconds) * 1000).toISOString(),
            duration: Math.round(c.durationSeconds / 60),
            url: `https://codeforces.com/contest/${c.id}`,
            status: c.phase === "BEFORE" ? "upcoming" : "live",
          }));
      }
      return [];
    } catch (error) {
      console.error("Codeforces API error:", error);
      return [];
    }
  }
}

export class KontestsAPI {
  private static readonly BASE_URL = "https://www.kontests.net/api/v1";

  static async getAllContests(): Promise<Contest[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/all`, {
        timeout: 15000,
        headers: { "User-Agent": "CodeArena Contest Tracker" },
      });
      const now = new Date();
      return response.data
        .filter((c: any) => new Date(c.end_time) > now)
        .slice(0, 50)
        .map((c: any) => ({
          id: `${c.site}-${c.name.replace(/\s+/g, "-")}-${Date.parse(c.start_time)}`,
          name: c.name,
          platform: this.normalizePlatform(c.site),
          start_time: c.start_time,
          end_time: c.end_time,
          duration: Math.round(
            (new Date(c.end_time).getTime() - new Date(c.start_time).getTime()) / 60000
          ),
          url: c.url,
          status:
            new Date(c.start_time) <= now && new Date(c.end_time) > now ? "live" : "upcoming",
        }));
    } catch (error) {
      console.error("Kontests API error:", error);
      return [];
    }
  }

  private static normalizePlatform(site: string): string {
    const map: Record<string, string> = {
      CodeForces: "Codeforces",
      CodeChef: "CodeChef",
      LeetCode: "LeetCode",
      AtCoder: "AtCoder",
      HackerRank: "HackerRank",
    };
    return map[site] || site;
  }
}

export class ContestService {
  static async fetchAllContests(): Promise<Contest[]> {
    const [cf, kt] = await Promise.allSettled([
      CodeforcesAPI.getContests(),
      KontestsAPI.getAllContests(),
    ]);
    const all: Contest[] = [
      ...(cf.status === "fulfilled" ? cf.value : []),
      ...(kt.status === "fulfilled" ? kt.value : []),
    ];
    return all
      .filter((c, i, s) => i === s.findIndex(x => x.name === c.name && x.platform === c.platform))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 100);
  }

  static async getContestsByPlatform(platform: string): Promise<Contest[]> {
    const all = await this.fetchAllContests();
    return all.filter(c => c.platform.toLowerCase().includes(platform.toLowerCase()));
  }
}
