import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sensorTypes } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const types = await db
      .select({
        id: sensorTypes.id,
        name: sensorTypes.name,
      })
      .from(sensorTypes);

    return NextResponse.json(types);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid type name" }, { status: 400 });
    }

    await db.insert(sensorTypes).values({ name });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Invalid type id" }, { status: 400 });
    }

    await db.delete(sensorTypes).where(eq(sensorTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
