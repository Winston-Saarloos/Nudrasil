import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sensors } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sensorId = url.searchParams.get("sensorId");

  if (!sensorId) {
    return NextResponse.json({ error: "Missing sensorId" }, { status: 400 });
  }

  const result = await db
    .select({
      id: sensors.id,
      min: sensors.minCalibratedValue,
      max: sensors.maxCalibratedValue,
    })
    .from(sensors)
    .where(eq(sensors.id, Number(sensorId)))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
  }

  return NextResponse.json({ data: result[0] });
}
