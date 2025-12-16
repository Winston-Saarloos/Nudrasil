"use client";

import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";
import { useAdminSecret } from "@hooks/useAdminSecret";

export default function AdminSecretInput() {
  const { secret, setSecret } = useAdminSecret();
  const {
    data: secretData,
    isLoading: isValidatingSecret,
    error: validationError,
    isError,
  } = useAdminSecretValidation(secret);

  const handleSecretChange = (value: string) => {
    setSecret(value);
  };

  return (
    <Card>
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
