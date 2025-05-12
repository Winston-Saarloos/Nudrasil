// app/api/admin/device-configs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { device_configs } from "@root/drizzle/schema";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const url = new URL(req.url);
    const deviceId = url.searchParams.get("deviceId");

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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { deviceId, config } = await req.json();

    await db.insert(device_configs).values({
      device_id: deviceId,
      config,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id, config } = await req.json();

    await db
      .update(device_configs)
      .set({ config })
      .where(eq(device_configs.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    await db.delete(device_configs).where(eq(device_configs.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
