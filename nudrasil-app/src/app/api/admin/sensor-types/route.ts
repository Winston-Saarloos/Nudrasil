import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sensorTypes } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";
import { requirePlantAdminRole } from "@/utils/requirePlantAdminRole";
import {
  createApiResponse,
  createApiError,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  // Allow read-only access without authentication
  try {
    const types = await db
      .select({
        id: sensorTypes.id,
        name: sensorTypes.name,
      })
      .from(sensorTypes);

    return createApiResponse({ data: types });
  } catch (err) {
    console.error("GET /api/admin/sensor-types error:", err);
    return createApiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlantAdminRole(req);

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return createApiError("Invalid type name", 400);
    }

    await db.insert(sensorTypes).values({ name });

    return createApiResponse({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return createUnauthorizedResponse();
    }
    console.error("POST /api/admin/sensor-types error:", err);
    return createApiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePlantAdminRole(req);

    const { id } = await req.json();

    if (!id || typeof id !== "number") {
      return createApiError("Invalid type id", 400);
    }

    await db.delete(sensorTypes).where(eq(sensorTypes.id, id));

    return createApiResponse({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return createUnauthorizedResponse();
    }
    console.error("DELETE /api/admin/sensor-types error:", err);
    return createApiError("Internal server error", 500);
  }
}
