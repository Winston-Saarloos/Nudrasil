import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function requirePlantAdminRole(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new Error("Unauthorized");
  }

  const hasPlantAdminRole =
    Array.isArray(token.roles) && token.roles.includes("plant-admin");

  if (!hasPlantAdminRole) {
    throw new Error("Missing required role.");
  }
}
