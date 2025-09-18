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
  } catch (error) {
    return createUnauthorizedResponse();
  }

  try {
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
  } catch (error) {
    console.error("Error fetching device configs:", error);
    return createApiResponse(
      {
        success: false,
        message: "Failed to fetch device configs",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);
  } catch (error) {
    return createUnauthorizedResponse();
  }

  try {
    const { deviceId, config } = await req.json();

    if (!deviceId || !config) {
      return createApiResponse(
        {
          success: false,
          message: "deviceId and config are required",
        },
        { status: 400 },
      );
    }

    await db.insert(device_configs).values({
      device_id: deviceId,
      config,
    });

    return createApiResponse({ success: true });
  } catch (error) {
    console.error("Error creating device config:", error);
    return createApiResponse(
      {
        success: false,
        message: "Failed to create device config",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await verifyAdminSecret(req);
  } catch (error) {
    return createUnauthorizedResponse();
  }

  try {
    const { id, config } = await req.json();

    if (!id || !config) {
      return createApiResponse(
        {
          success: false,
          message: "id and config are required",
        },
        { status: 400 },
      );
    }

    await db
      .update(device_configs)
      .set({ config })
      .where(eq(device_configs.id, id));

    return createApiResponse({ success: true });
  } catch (error) {
    console.error("Error updating device config:", error);
    return createApiResponse(
      {
        success: false,
        message: "Failed to update device config",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);
  } catch (error) {
    return createUnauthorizedResponse();
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return createApiResponse(
        {
          success: false,
          message: "id is required",
        },
        { status: 400 },
      );
    }

    await db.delete(device_configs).where(eq(device_configs.id, id));
    return createApiResponse({ success: true });
  } catch (error) {
    console.error("Error deleting device config:", error);
    return createApiResponse(
      {
        success: false,
        message: "Failed to delete device config",
      },
      { status: 500 },
    );
  }
}
