import { NextRequest } from "next/server";
import { verifyAdminSecret } from "@/utils/verifyAdminSecret";
import {
  createApiResponse,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSecret(req);
    return createApiResponse({ isValid: true });
  } catch {
    return createUnauthorizedResponse("Invalid admin secret");
  }
}
