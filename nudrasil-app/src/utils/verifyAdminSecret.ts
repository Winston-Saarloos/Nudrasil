import { NextRequest } from "next/server";

export async function verifyAdminSecret(req: NextRequest) {
  const adminSecret = req.headers.get("authorization");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
}
