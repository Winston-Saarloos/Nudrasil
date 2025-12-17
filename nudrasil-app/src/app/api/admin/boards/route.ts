// app/api/admin/boards/route.ts
import { db } from "@/lib/db";
import { boards } from "@root/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";
import {
  createApiResponse,
  createApiError,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";

export async function GET() {
  // Allow read-only access without authentication
  try {
    const data = await db.select().from(boards).orderBy(boards.id);
    return createApiResponse({ data });
  } catch (error) {
    console.error("Error fetching boards:", error);
    return createApiError("Failed to fetch boards", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { name, location } = await req.json();

    if (!name || !location) {
      return createApiError("Missing fields", 400);
    }

    await db.insert(boards).values({
      name,
      location,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return createApiResponse({ success: true });
  } catch {
    return createUnauthorizedResponse();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id, name, location } = await req.json();

    if (!id || !name || !location) {
      return createApiError("Missing fields", 400);
    }

    await db
      .update(boards)
      .set({ name, location, updatedAt: new Date() })
      .where(eq(boards.id, id));

    return createApiResponse({ success: true });
  } catch {
    return createUnauthorizedResponse();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSecret(req);

    const { id } = await req.json();

    if (!id) {
      return createApiError("Missing board ID", 400);
    }

    await db.delete(boards).where(eq(boards.id, id));
    return createApiResponse({ success: true });
  } catch {
    return createUnauthorizedResponse();
  }
}
