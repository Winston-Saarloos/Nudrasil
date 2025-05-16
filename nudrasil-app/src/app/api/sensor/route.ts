import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sensors, sensorReadings, boards } from "@root/drizzle/schema";
import { eq, desc, and, not } from "drizzle-orm";

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

    // Find sensor by name
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

    // Insert new reading
    await db.insert(sensorReadings).values({
      sensorId: sensorId,
      value: body.value,
      readingTime: readingTime, // Store as ISO string
    });

    if (boardId) {
      // Clear the IP from any other board that has it
      await db
        .update(boards)
        .set({ lastKnownIp: null })
        .where(and(eq(boards.lastKnownIp, ip), not(eq(boards.id, boardId))));

      // Set the IP on the current board
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const sensorIdParam = searchParams.get("sensorId");
    const sensorId = sensorIdParam ? parseInt(sensorIdParam, 10) : null;

    if (sensorIdParam && (isNaN(sensorId!) || sensorId! <= 0)) {
      return NextResponse.json(
        { success: false, error: "Invalid sensorId" },
        { status: 400 },
      );
    }

    const rawReadings = await db
      .select({
        id: sensorReadings.id,
        sensorId: sensorReadings.sensorId,
        value: sensorReadings.value,
        readingTime: sensorReadings.readingTime,
      })
      .from(sensorReadings)
      .where(sensorId ? eq(sensorReadings.sensorId, sensorId) : undefined)
      .orderBy(desc(sensorReadings.readingTime))
      .limit(400);

    const data = rawReadings.map((r) => ({
      ...r,
      readingTime: r.readingTime
        ? new Date(r.readingTime).toISOString()
        : new Date().toISOString(),
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
