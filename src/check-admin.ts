import { db, pool } from "./db.js";
import { users } from "./shared/schema.js";

import { eq } from "drizzle-orm";

async function checkAdmin() {
  try {
    const [admin] = await db.select().from(users).where(eq(users.username, "admin"));
    if (admin) {
      console.log("✅ Admin user exists.");
    } else {
      console.log("❌ Admin user does NOT exist.");
    }
  } catch (err) {
    console.error("Error checking admin:", err);
  } finally {
    await pool.end();
  }
}

checkAdmin();
