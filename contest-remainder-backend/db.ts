import "dotenv/config";
import pg from "pg";
const { Pool } = pg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing from environment");
  throw new Error("DATABASE_URL must be set.");
}

console.log(`📡 Database URL detected (length: ${process.env.DATABASE_URL.length})`);

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
