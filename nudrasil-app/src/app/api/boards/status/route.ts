import { db } from "@/lib/db";
import { boards } from "@root/drizzle/schema";
import { isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

function normalizeIp(ip: string | null): string {
  if (!ip) return "0.0.0.0";
  return ip.startsWith("::ffff:") ? ip.replace("::ffff:", "") : ip;
}

export async function GET() {
  const boardList = await db
    .select({ id: boards.id, name: boards.name, ip: boards.lastKnownIp })
    .from(boards)
    .where(isNotNull(boards.lastKnownIp));

  console.log(boardList);

  const checks = await Promise.all(
    boardList.map(async (board) => {
      const start = Date.now();
      try {
        const normalizedIp = normalizeIp(board.ip);
        const res = await fetchWithTimeout(
          `http://${normalizedIp}/health`,
          2000,
        );
        const text = await res.text();
        const healthy = text.trim().toLowerCase() === "healthy";
        return {
          id: board.id,
          name: board.name,
          status: healthy ? "healthy" : "invalid-response",
          latencyMs: Date.now() - start,
        };
      } catch (err) {
        return {
          id: board.id,
          name: board.name,
          status: "unreachable",
          latencyMs: null,
        };
      }
    }),
  );

  return NextResponse.json({ data: checks });
}
