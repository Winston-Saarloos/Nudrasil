"use client";

import { useState } from "react";

import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";

interface AdminSecretInputProps {
  onSecretChange: (secret: string) => void;
  className?: string;
}

export default function AdminSecretInput({
  onSecretChange,
  className = "",
}: AdminSecretInputProps) {
  const [secret, setSecret] = useState("");
  const {
    data: secretData,
    isLoading: isValidatingSecret,
    error: validationError,
    isError,
  } = useAdminSecretValidation(secret);

  const handleSecretChange = (value: string) => {
    setSecret(value);
    onSecretChange(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Admin Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Enter Admin Secret"
            value={secret}
            onChange={(e) => handleSecretChange(e.target.value)}
            className="max-w-md"
          />
          {isValidatingSecret && (
            <p className="text-sm text-muted-foreground">
              Validating secret...
            </p>
          )}
          {secret && !isValidatingSecret && !secretData?.isValid && isError && (
            <p className="text-sm text-red-600">
              {validationError?.message || "Invalid admin secret"}
            </p>
          )}
          {secret && !isValidatingSecret && secretData?.isValid && (
            <p className="text-sm text-green-600">✓ Secret validated</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
