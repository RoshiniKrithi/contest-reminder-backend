import "dotenv/config";
import { initializeApp, app } from "./app";
import { log } from "./log";

async function startServer() {
  const server = await initializeApp();

  const PORT = Number(process.env.PORT) || 5000;

  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("❌ Fatal: Failed to start server:", err);
  process.exit(1);
});
