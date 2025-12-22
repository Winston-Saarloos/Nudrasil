import { NextRequest } from "next/server";
import { requirePlantAdminRole } from "@/utils/requirePlantAdminRole";
import {
  createApiResponse,
  createUnauthorizedResponse,
} from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    await requirePlantAdminRole(req);
    return createApiResponse({ isValid: true });
  } catch {
    return createUnauthorizedResponse("Authentication required");
  }
}
