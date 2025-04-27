// app/api/admin/device-configs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { device_configs } from "@root/drizzle/schema";

const ADMIN_SECRET = process.env.ADMIN_SECRET!;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const deviceId = url.searchParams.get("deviceId");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (deviceId) {
    const configs = await db
      .select()
      .from(device_configs)
      .where(eq(device_configs.device_id, deviceId));

    return NextResponse.json(configs);
  } else {
    const configs = await db.select().from(device_configs);
    return NextResponse.json(configs);
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { deviceId, config } = body;

  await db.insert(device_configs).values({
    device_id: deviceId,
    config,
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, config } = body;

  await db
    .update(device_configs)
    .set({ config })
    .where(eq(device_configs.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  await db.delete(device_configs).where(eq(device_configs.id, id));
  return NextResponse.json({ success: true });
}
