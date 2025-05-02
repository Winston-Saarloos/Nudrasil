"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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
  const [secret, setSecret] = useState("");
  const [configs, setConfigs] = useState<DeviceConfig[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newConfig, setNewConfig] = useState("{}");
  const [unlocked, setUnlocked] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    const storedSecret = localStorage.getItem("admin_secret");
    if (storedSecret) {
      setSecret(storedSecret);
      attemptUnlock(storedSecret);
    }
  }, []);

  const attemptUnlock = async (value: string) => {
    const res = await fetch(`/api/admin/device-configs?secret=${value}`);
    if (res.ok) {
      const data = await res.json();
      setConfigs(data);
      setUnlocked(true);
      fetchBoards(value);
    }
  };

  const fetchBoards = async (adminSecret = secret) => {
    const res = await fetch(`/api/admin/boards`, {
      headers: {
        Authorization: adminSecret,
      },
    });
    if (res.ok) {
      const json = await res.json();
      setBoards(json.data);
    }
  };

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
    if (!validateJson(newConfig)) {
      alert("Please fix JSON before submitting");
      return;
    }

    const parsed = JSON.parse(newConfig);
    const res = await fetch(`/api/admin/device-configs?secret=${secret}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: newDeviceId,
        config: parsed,
      }),
    });

    if (res.ok) {
      await attemptUnlock(secret);
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
    try {
      const res = await fetch(`/api/admin/device-configs?secret=${secret}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          config: updatedConfig,
        }),
      });

      if (res.ok) {
        await attemptUnlock(secret);
      } else {
        alert("Failed to update config");
      }
    } catch {
      alert("Invalid JSON format!");
    }
  };

  const deleteConfig = async (id: number) => {
    if (!confirm("Are you sure you want to delete this config?")) return;

    const res = await fetch(`/api/admin/device-configs?secret=${secret}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      await attemptUnlock(secret);
    } else {
      alert("Failed to delete config");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Device Configs Admin</h1>

      {!unlocked && (
        <div className="flex items-center gap-4">
          <Input
            type="password"
            placeholder="Enter Admin Secret"
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value);
              localStorage.setItem("admin_secret", e.target.value);
            }}
          />
          <Button onClick={() => attemptUnlock(secret)}>Load Configs</Button>
        </div>
      )}

      {unlocked && (
        <>
          {configs.length > 0 && (
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

          <div>
            <h2 className="text-2xl font-semibold mt-10 mb-4">
              Create New Config
            </h2>
            <div className="space-y-4">
              <Input
                placeholder="Device ID (e.g., ESP001)"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
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
                <Button onClick={createConfig}>Create Config</Button>
                <Button variant="outline" onClick={formatJson}>
                  Format JSON
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Available Boards</h2>
            {boards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boards.map((board) => (
                  <Card key={board.id}>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {`${board.name} (ID: ${board.id}) ${board.location ? board.location : ""}`}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No boards found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
