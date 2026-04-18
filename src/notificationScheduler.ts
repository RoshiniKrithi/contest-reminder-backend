import cron from "node-cron";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db.js";
import { contests } from "./shared/schema.js";
import { sendWhatsAppReminder, isTwilioConfigured } from "./whatsappService.js";
import { log } from "./log.js";

const NOTIFY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

async function checkAndNotify() {
  if (!isTwilioConfigured()) return; // silently skip if not configured

  const now = new Date();
  const windowEnd = new Date(now.getTime() + NOTIFY_WINDOW_MS);

  try {
    // Fetch upcoming contests starting within the next 10 minutes that haven't been notified
    const upcoming = await db
      .select()
      .from(contests)
      .where(
        and(
          eq(contests.notified, false),
          // startTime > now
          sql`${contests.startTime} > ${now}`,
          // startTime <= now + 10 min
          sql`${contests.startTime} <= ${windowEnd}`
        )
      );

    if (upcoming.length === 0) return;

    log(`🔔 [Notifier] Found ${upcoming.length} contest(s) starting within 10 minutes.`);

    for (const contest of upcoming) {
      const sent = await sendWhatsAppReminder({
        id: contest.id,
        title: contest.title,
        platform: contest.platform,
        startTime: contest.startTime,
        url: contest.url,
      });

      if (sent) {
        // Mark as notified so we never send twice
        await db
          .update(contests)
          .set({ notified: true } as any)
          .where(eq(contests.id, contest.id));
      }
    }
  } catch (err: any) {
    log(`❌ [Notifier] Error during notification check: ${err.message}`);
  }
}

export function setupNotificationScheduler() {
  if (!isTwilioConfigured()) {
    log("ℹ️  [Notifier] Twilio not configured — WhatsApp notifications disabled.");
    return;
  }

  // Run every minute
  cron.schedule("* * * * *", checkAndNotify);
  log("✅ [Notifier] WhatsApp notification scheduler started (checks every minute).");
}
