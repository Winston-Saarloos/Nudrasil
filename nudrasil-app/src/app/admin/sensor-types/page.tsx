"use client";

import { useState } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import AuthButton from "@components/AuthButton";
import ReadOnlyAlert from "@components/ReadOnlyAlert";
import { useSensorTypes } from "@hooks/useSensorTypes";
import { usePlantAdmin } from "@hooks/usePlantAdmin";
import {
  createSensorType,
  deleteSensorType,
} from "@/controllers/sensorTypesController";

export default function SensorTypesAdminPage() {
  const [newTypeName, setNewTypeName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { session, isReadOnly } = usePlantAdmin();
  const {
    data: sensorTypes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSensorTypes();

  const handleCreateType = async () => {
    if (isReadOnly || !session?.accessToken) {
      setStatus("Please sign in to make changes");
      return;
    }

    if (!newTypeName.trim()) {
      setStatus("Type name is required");
      return;
    }

    try {
      await createSensorType(session.accessToken, { name: newTypeName });
      setStatus("✓ Sensor type created");
      setNewTypeName("");
      refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteType = async (id: number) => {
    if (isReadOnly || !session?.accessToken) {
      setStatus("Please sign in to make changes");
      return;
    }

    try {
      await deleteSensorType(session.accessToken, { id });
      setStatus("✓ Sensor type deleted");
      refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Sensor Types Admin</h1>

      <AuthButton />

      {isReadOnly && <ReadOnlyAlert />}

      <Card>
        <CardHeader>
          <CardTitle>Create New Sensor Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="New Type Name"
              className="max-w-md"
              disabled={isReadOnly}
            />
            <Button
              onClick={handleCreateType}
              disabled={isReadOnly || !newTypeName.trim()}
            >
              Add Type
            </Button>
          </div>
          {status && (
            <p
              className={`text-sm ${status.includes("✓") ? "text-green-600" : "text-red-600"}`}
            >
              {status}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Sensor Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading sensor types...</p>
          ) : isError ? (
            <p className="text-red-600">
              Error loading sensor types:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          ) : sensorTypes && sensorTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sensorTypes.map((type) => (
                <Card key={type.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          ID: {type.id}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteType(type.id)}
                        disabled={isReadOnly}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No sensor types found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
