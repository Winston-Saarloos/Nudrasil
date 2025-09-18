import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sensorTypes } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";
import {
  createApiResponse,
  createApiError,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const types = await db
      .select({
        id: sensorTypes.id,
        name: sensorTypes.name,
      })
      .from(sensorTypes);

    return createApiResponse({ data: types });
  } catch (err) {
    return createUnauthorizedResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return createApiError("Invalid type name", 400);
    }

    await db.insert(sensorTypes).values({ name });

    return createApiResponse({ success: true });
  } catch (err) {
    return createUnauthorizedResponse();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    if (!id || typeof id !== "number") {
      return createApiError("Invalid type id", 400);
    }

    await db.delete(sensorTypes).where(eq(sensorTypes.id, id));

    return createApiResponse({ success: true });
  } catch (err) {
    return createUnauthorizedResponse();
  }
}
