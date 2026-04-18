import cron from "node-cron";
import { ContestService } from "./contest-apis.js";
import { storage } from "./storage.js";
import { log } from "./log.js";

export function setupContestScheduler() {
  // Sync every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    await syncContestsWithDatabase();
  });

  // Initial sync on startup
  syncContestsWithDatabase().catch(err => console.error("Initial contest sync failed:", err));
}

async function syncContestsWithDatabase() {
  try {
    log("📡 Intelligence Sync: Refreshing global contest database...");
    
    // Fetch from all real APIs
    const realContests = await ContestService.fetchAllContests(true);
    
    if (realContests.length === 0) {
      log("⚠️ Intelligence Sync: No contests received from APIs. Skipping update.");
      return;
    }

    let updatedCount = 0;
    let newCount = 0;

    for (const contest of realContests) {
      try {
        // Try to find if this contest already exists in DB
        const allDbContests = await storage.getAllContests();
        const existing = allDbContests.find(c => 
          c.externalId === contest.externalId || 
          c.url === contest.url ||
          (c.title === contest.title && c.platform === contest.platform)
        );

        const contestData = {
          title: contest.title,
          platform: contest.platform,
          url: contest.url,
          startTime: new Date(contest.startTime),
          endTime: new Date(contest.endTime),
          duration: contest.duration,
          status: contest.status,
          externalId: contest.externalId || contest.id,
          createdBy: "system"
        };

        if (existing) {
          // Update existing record
          await storage.updateContestStatus(existing.id, contest.status);
          updatedCount++;
        } else {
          // Create new record
          await storage.createContest(contestData);
          newCount++;
        }
      } catch (err) {
        console.error(`Failed to sync contest: ${contest.title}`, err);
      }
    }

    log(`✅ Intelligence Sync: Complete. ${newCount} new missions tracked, ${updatedCount} updated.`);
  } catch (error) {
    log(`❌ Intelligence Sync: Critical failure: ${error}`);
  }
}
