import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sensors, sensorReadings, boards } from "@root/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    console.log("Incoming ESP payload:", body);

    if (typeof body.sensor !== "string" || typeof body.value !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 },
      );
    }

    const readingTime = new Date().toISOString(); // Ensure UTC ISO string
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";

    // 1. Find sensor by name
    const sensorResult = await db
      .select({ id: sensors.id, boardId: sensors.boardId })
      .from(sensors)
      .where(eq(sensors.name, body.sensor))
      .limit(1);

    if (sensorResult.length === 0) {
      console.error("Sensor not found:", body.sensor);
      return NextResponse.json(
        { success: false, error: "Sensor not found" },
        { status: 404 },
      );
    }

    const sensorId = sensorResult[0].id;
    const boardId = sensorResult[0].boardId;

    // 2. Insert new reading
    await db.insert(sensorReadings).values({
      sensorId: sensorId,
      value: body.value,
      readingTime: readingTime, // Store as ISO string
    });

    if (boardId) {
      await db
        .update(boards)
        .set({ lastKnownIp: ip })
        .where(eq(boards.id, boardId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error handling ESP sensor POST:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const rawReadings = await db
      .select({
        id: sensorReadings.id,
        sensorId: sensorReadings.sensorId,
        value: sensorReadings.value,
        readingTime: sensorReadings.readingTime,
      })
      .from(sensorReadings)
      .orderBy(desc(sensorReadings.readingTime))
      .limit(100);

    // Convert readingTime to ISO 8601 strings (if needed)
    const data = rawReadings.map((r) => ({
      ...r,
      readingTime: r.readingTime
        ? new Date(r.readingTime).toISOString()
        : new Date().toISOString(), // fallback if null
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error fetching sensor readings:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch readings" },
      { status: 500 },
    );
  }
}
