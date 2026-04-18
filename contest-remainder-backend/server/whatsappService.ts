import twilio from "twilio";
import { log } from "./log";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
const toNumber   = process.env.USER_WHATSAPP_NUMBER;

// Lazily initialise client — only when credentials are present
function getClient() {
  if (!accountSid || !authToken) return null;
  try {
    return twilio(accountSid, authToken);
  } catch {
    return null;
  }
}

export interface ContestForNotification {
  id: string;
  title: string;
  platform: string;
  startTime: Date | string;
  url: string | null;
}

export async function sendWhatsAppReminder(contest: ContestForNotification): Promise<boolean> {
  const client = getClient();

  if (!client) {
    log("⚠️ [WhatsApp] Twilio credentials not set — skipping notification.");
    return false;
  }

  if (!toNumber) {
    log("⚠️ [WhatsApp] USER_WHATSAPP_NUMBER not set — skipping notification.");
    return false;
  }

  const startFormatted = new Date(contest.startTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const body = [
    `🚀 *Contest Reminder!*`,
    ``,
    `📌 *${contest.title}*`,
    `🏆 Platform: ${contest.platform}`,
    `⏰ Starts at: ${startFormatted} IST`,
    `🔗 Join here: ${contest.url || "N/A"}`,
    ``,
    `Good luck! 💪`,
  ].join("\n");

  try {
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body,
    });

    log(`✅ [WhatsApp] Reminder sent for "${contest.title}" — SID: ${message.sid}`);
    return true;
  } catch (err: any) {
    log(`❌ [WhatsApp] Failed to send for "${contest.title}": ${err.message}`);
    return false;
  }
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && toNumber);
}
