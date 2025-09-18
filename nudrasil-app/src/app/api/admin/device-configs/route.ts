// app/api/admin/device-configs/route.ts
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { device_configs } from "@root/drizzle/schema";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";
import {
  createApiResponse,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";

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
      return createApiResponse({ data: configs });
    } else {
      const configs = await db.select().from(device_configs);
      return createApiResponse({ data: configs });
    }
  } catch {
    return createUnauthorizedResponse();
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

    return createApiResponse({ success: true });
  } catch {
    return createUnauthorizedResponse();
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

    return createApiResponse({ success: true });
  } catch {
    return createUnauthorizedResponse();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    await db.delete(device_configs).where(eq(device_configs.id, id));
    return createApiResponse({ success: true });
  } catch {
    return createUnauthorizedResponse();
  }
}
