import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@root/drizzle/schema";

// Debug: Log database connection config
console.log("=== Database Connection Config ===");
console.log("PG_HOST:", process.env.PG_HOST);
console.log("PG_USER:", process.env.PG_USER);
console.log("PG_DATABASE:", process.env.PG_DATABASE);
console.log("PG_PASSWORD:", process.env.PG_PASSWORD ? "[SET]" : "[NOT SET]");
console.log("==================================");

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: false, //process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", () => {
  console.log("Successfully connected to PostgreSQL");
});

export const db = drizzle(pool, { schema });
