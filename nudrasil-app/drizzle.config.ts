import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${nodeEnv}` });

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PG_HOST!,
    port: 5432,
    user: "postgres",
    password: process.env.PG_PASSWORD!,
    database: process.env.PG_DATABASE!,
    ssl: false,
  },
} satisfies Config;
