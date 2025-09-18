"use client";

import { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import AdminSecretInput from "@components/AdminSecretInput";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";

interface SensorType {
  id: number;
  name: string;
}

export default function SensorTypesAdminPage() {
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [secret, setSecret] = useState("");

  const { data: secretData } = useAdminSecretValidation(secret);

  useEffect(() => {
    if (secretData?.isValid) {
      fetchTypes();
    }
  }, [secretData]);

  async function fetchTypes() {
    if (!secretData?.secret || !secretData?.isValid) return;
    const res = await fetch("/api/admin/sensor-types", {
      headers: { Authorization: secretData.secret },
    });
    const data: SensorType[] = await res.json();
    setSensorTypes(data);
  }

  async function createType() {
    if (!newTypeName.trim() || !secretData?.secret || !secretData?.isValid)
      return;
    await fetch("/api/admin/sensor-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
      body: JSON.stringify({ name: newTypeName }),
    });
    setNewTypeName("");
    fetchTypes();
  }

  async function deleteType(id: number) {
    if (!secretData?.secret || !secretData?.isValid) return;
    await fetch("/api/admin/sensor-types", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
      body: JSON.stringify({ id }),
    });
    fetchTypes();
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Sensor Types Admin</h1>

      <AdminSecretInput onSecretChange={setSecret} />

      {secretData?.isValid && (
        <>
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
                />
                <Button onClick={createType} disabled={!newTypeName.trim()}>
                  Add Type
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Sensor Types</CardTitle>
            </CardHeader>
            <CardContent>
              {sensorTypes && sensorTypes.length > 0 ? (
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
                            onClick={() => deleteType(type.id)}
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
        </>
      )}
    </div>
  );
}
