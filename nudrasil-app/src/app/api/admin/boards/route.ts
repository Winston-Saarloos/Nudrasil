// app/api/admin/boards/route.ts
import { db } from "@/lib/db";
import { boards } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const data = await db.select().from(boards).orderBy(boards.id);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { name, location, secret } = await req.json();

  if (secret !== process.env.ADMIN_SENSOR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!name || !location) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db.insert(boards).values({
    name,
    location,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { id, name, location, secret } = await req.json();

  if (secret !== process.env.ADMIN_SENSOR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id || !name || !location) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db
    .update(boards)
    .set({
      name,
      location,
      updatedAt: new Date(),
    })
    .where(eq(boards.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id, secret } = await req.json();

  if (secret !== process.env.ADMIN_SENSOR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing board ID" }, { status: 400 });
  }

  await db.delete(boards).where(eq(boards.id, id));
  return NextResponse.json({ success: true });
}
