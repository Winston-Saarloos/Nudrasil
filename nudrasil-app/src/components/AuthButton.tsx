"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (session) {
    const hasPlantAdminRole =
      Array.isArray(session.roles) && session.roles.includes("plant-admin");

    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Signed in as: {session.user?.email || session.user?.name}
          </p>
          {!hasPlantAdminRole && (
            <p className="text-sm text-yellow-600">
              ⚠ plant-admin role required for changes
            </p>
          )}
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Sign in to make changes</p>
        <Button onClick={() => signIn("keycloak")}>
          Sign In with Keycloak
        </Button>
      </CardContent>
    </Card>
  );
}
