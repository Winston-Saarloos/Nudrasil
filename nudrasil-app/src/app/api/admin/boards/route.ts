// app/api/admin/boards/route.ts
import { db } from "@/lib/db";
import { boards } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const data = await db.select().from(boards).orderBy(boards.id);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { name, location } = await req.json();

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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id, name, location } = await req.json();

    if (!id || !name || !location) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await db
      .update(boards)
      .set({ name, location, updatedAt: new Date() })
      .where(eq(boards.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing board ID" }, { status: 400 });
    }

    await db.delete(boards).where(eq(boards.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
