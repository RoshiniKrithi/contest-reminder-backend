export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
  
  try {
    const fs = require('fs');
    fs.appendFileSync('debug-backend.log', `${formattedTime} [${source}] ${message}\n`);
  } catch (e) {
    console.error("Failed to write log", e);
  }
}
