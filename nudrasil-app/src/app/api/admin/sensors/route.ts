import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sensors } from "@root/drizzle/schema";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const results = await db
      .select({
        id: sensors.id,
        name: sensors.name,
        location: sensors.location,
        typeId: sensors.typeId,
        boardId: sensors.boardId,
        minCalibratedValue: sensors.minCalibratedValue,
        maxCalibratedValue: sensors.maxCalibratedValue,
      })
      .from(sensors);

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const {
      name,
      location,
      typeId,
      boardId,
      minCalibratedValue,
      maxCalibratedValue,
    } = await req.json();

    await db.insert(sensors).values({
      name,
      location,
      typeId,
      boardId: boardId || null,
      minCalibratedValue: minCalibratedValue ?? null,
      maxCalibratedValue: maxCalibratedValue ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    await db.delete(sensors).where(eq(sensors.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const body = await req.json();
    const {
      id,
      name,
      location,
      typeId,
      boardId,
      minCalibratedValue,
      maxCalibratedValue,
    } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Invalid sensor id" }, { status: 400 });
    }

    await db
      .update(sensors)
      .set({
        name,
        location,
        typeId,
        boardId: boardId || null,
        minCalibratedValue: minCalibratedValue ?? null,
        maxCalibratedValue: maxCalibratedValue ?? null,
      })
      .where(eq(sensors.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH ERROR]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
