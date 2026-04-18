import "dotenv/config";
import { initializeApp, app } from "./app.js";
import { log } from "./log.js";
import { setupContestScheduler } from "./scheduler.js";
import { setupNotificationScheduler } from "./notificationScheduler.js";

async function startServer() {
  const server = await initializeApp();

  const PORT = Number(process.env.PORT) || 5000;

  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Global server heart-beat detected on port ${PORT}`);
    setupContestScheduler();
    setupNotificationScheduler();
  });
}




startServer().catch(err => {
  console.error("❌ Fatal: Failed to start server:", err);
  process.exit(1);
});
