// app/api/admin/device-configs/route.ts
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { device_configs } from "@root/drizzle/schema";
import { requirePlantAdminRole } from "@/utils/requirePlantAdminRole";
import {
  createApiResponse,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";
import { getToken } from "next-auth/jwt";

// Simple IP address pattern - matches IPv4 addresses (e.g., 192.168.1.1)
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

/**
 * Recursively masks IP addresses in a JSON object
 */
function maskIpsInObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Mask IP addresses in strings: 192.168.1.1 -> ***.***.*.*
    return obj.replace(IP_REGEX, (match) =>
      match
        .split(".")
        .map((octet) => "*".repeat(octet.length))
        .join("."),
    );
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskIpsInObject(item));
  }

  if (typeof obj === "object") {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      masked[key] = maskIpsInObject(value);
    }
    return masked;
  }

  return obj;
}

/**
 * Checks if the request has a valid device secret in the Authorization header
 */
function hasValidDeviceSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  // Check if the Authorization header matches the device secret
  // The firmware sends: Authorization: {secret}
  const deviceSecret = process.env.ADMIN_SECRET;
  return authHeader === deviceSecret;
}

/**
 * Checks if the user has a valid token with plant-admin role OR a valid device secret
 */
async function hasPlantAdminRole(req: NextRequest): Promise<boolean> {
  if (hasValidDeviceSecret(req)) {
    return true;
  }

  // Then check for NextAuth token
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return false;
    }

    const hasPlantAdminRole =
      Array.isArray(token.roles) && token.roles.includes("plant-admin");

    return hasPlantAdminRole;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Allow read-only access without authentication, but mask IPs if not authenticated
  try {
    const url = new URL(req.url);
    const deviceId = url.searchParams.get("deviceId");
    const isAuthenticated = await hasPlantAdminRole(req);

    let configs;
    if (deviceId) {
      configs = await db
        .select()
        .from(device_configs)
        .where(eq(device_configs.device_id, deviceId));
    } else {
      configs = await db.select().from(device_configs);
    }

    // Mask IP addresses if user is not authenticated
    if (!isAuthenticated) {
      configs = configs.map((config) => ({
        ...config,
        config: maskIpsInObject(config.config) as Record<string, unknown>,
      }));
    }

    return createApiResponse({ data: configs });
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
    await requirePlantAdminRole(req);
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
    await requirePlantAdminRole(req);
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
    await requirePlantAdminRole(req);
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
