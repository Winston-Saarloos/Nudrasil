"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@components/ui/card";
import AdminSecretInput from "@components/AdminSecretInput";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";

interface DeviceConfig {
  id: number;
  device_id: string;
  config: Record<string, unknown>;
}

interface Board {
  id: number;
  name: string;
  location: string | null;
}

export default function DeviceConfigsAdminPage() {
  const [configs, setConfigs] = useState<DeviceConfig[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newConfig, setNewConfig] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [secret, setSecret] = useState("");

  const { data: secretData } = useAdminSecretValidation(secret);

  const fetchBoards = useCallback(async () => {
    if (!secretData?.secret || !secretData?.isValid) return;

    const res = await fetch(`/api/admin/boards`, {
      headers: {
        Authorization: secretData.secret,
      },
    });
    if (res.ok) {
      const json = await res.json();
      setBoards(json.data);
    }
  }, [secretData]);

  const loadConfigs = useCallback(async () => {
    if (!secretData?.secret || !secretData?.isValid) return;

    const res = await fetch(`/api/admin/device-configs`, {
      headers: { Authorization: secretData.secret },
    });
    if (res.ok) {
      const data = await res.json();
      setConfigs(data);
      fetchBoards();
    }
  }, [secretData, fetchBoards]);

  useEffect(() => {
    if (secretData?.isValid) {
      loadConfigs();
    }
  }, [secretData, loadConfigs]);

  const validateJson = (text: string) => {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (err) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(newConfig);
      const formatted = JSON.stringify(parsed, null, 2);
      setNewConfig(formatted);
      setJsonError(null);
    } catch {
      setJsonError("Cannot format invalid JSON");
    }
  };

  const createConfig = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      alert("Invalid admin secret");
      return;
    }

    if (!validateJson(newConfig)) {
      alert("Please fix JSON before submitting");
      return;
    }

    const parsed = JSON.parse(newConfig);
    const res = await fetch(`/api/admin/device-configs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
      body: JSON.stringify({
        deviceId: newDeviceId,
        config: parsed,
      }),
    });

    if (res.ok) {
      await loadConfigs();
      setNewDeviceId("");
      setNewConfig("{}");
    } else {
      alert("Failed to create config");
    }
  };

  const updateConfig = async (
    id: number,
    updatedConfig: Record<string, unknown>,
  ) => {
    if (!secretData?.secret || !secretData?.isValid) {
      alert("Invalid admin secret");
      return;
    }

    try {
      const res = await fetch(`/api/admin/device-configs`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: secretData.secret,
        },
        body: JSON.stringify({
          id,
          config: updatedConfig,
        }),
      });

      if (res.ok) {
        await loadConfigs();
      } else {
        alert("Failed to update config");
      }
    } catch {
      alert("Invalid JSON format!");
    }
  };

  const deleteConfig = async (id: number) => {
    if (!secretData?.secret || !secretData?.isValid) {
      alert("Invalid admin secret");
      return;
    }

    if (!confirm("Are you sure you want to delete this config?")) return;

    const res = await fetch(`/api/admin/device-configs`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      await loadConfigs();
    } else {
      alert("Failed to delete config");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Device Configs Admin</h1>

      <AdminSecretInput onSecretChange={setSecret} />

      {secretData?.isValid && (
        <>
          {configs && configs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle>{config.device_id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(config.config, null, 2)}
                      rows={10}
                      onChange={(e) => {
                        const updated = [...configs];
                        const index = updated.findIndex(
                          (c) => c.id === config.id,
                        );
                        try {
                          updated[index].config = JSON.parse(e.target.value);
                          setConfigs(updated);
                        } catch {
                          // Optional: Show parse error
                        }
                      }}
                    />
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      onClick={() => updateConfig(config.id, config.config)}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteConfig(config.id)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Create New Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Device ID (e.g., ESP001)"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                className="max-w-md"
              />
              <Textarea
                className="font-mono"
                placeholder="New Config JSON"
                rows={10}
                value={newConfig}
                onChange={(e) => {
                  setNewConfig(e.target.value);
                  validateJson(e.target.value);
                }}
              />
              {jsonError && <p className="text-red-500 text-sm">{jsonError}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={createConfig}
                  disabled={
                    !newDeviceId.trim() || !newConfig.trim() || !!jsonError
                  }
                >
                  Create Config
                </Button>
                <Button variant="outline" onClick={formatJson}>
                  Format JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Boards</CardTitle>
            </CardHeader>
            <CardContent>
              {boards && boards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boards.map((board) => (
                    <Card key={board.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{board.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {board.id}
                          </p>
                          {board.location && (
                            <p className="text-sm text-muted-foreground">
                              Location: {board.location}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No boards found.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
