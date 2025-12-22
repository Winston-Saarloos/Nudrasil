"use client";

import { useSession } from "next-auth/react";

export function usePlantAdmin() {
  const { data: session, status: sessionStatus } = useSession();

  const hasPlantAdminRole =
    Array.isArray(session?.roles) && session?.roles.includes("plant-admin");

  const isReadOnly =
    !session || sessionStatus !== "authenticated" || !hasPlantAdminRole;

  return {
    session,
    sessionStatus,
    hasPlantAdminRole,
    isReadOnly,
  };
}

