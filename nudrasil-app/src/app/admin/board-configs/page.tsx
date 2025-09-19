"use client";

import { useState } from "react";
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
import { useDeviceConfigs } from "@hooks/useDeviceConfigs";
import { useBoards } from "@hooks/useBoards";
import {
  createDeviceConfig,
  updateDeviceConfig,
  deleteDeviceConfig,
} from "@/controllers/deviceConfigsController";

export default function DeviceConfigsAdminPage() {
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newConfig, setNewConfig] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const { data: secretData } = useAdminSecretValidation(secret);
  const {
    data: configs = [],
    isLoading: configsLoading,
    isError: configsError,
    error: configsErrorData,
    refetch: refetchConfigs,
  } = useDeviceConfigs(secretData?.isValid || false, secretData?.secret);
  const {
    data: boards = [],
    isLoading: boardsLoading,
    isError: boardsError,
    error: boardsErrorData,
  } = useBoards(secretData?.isValid || false, secretData?.secret);

  const validateJson = (text: string) => {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError("Invalid JSON format");
      console.error(error);
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

  const handleCreateConfig = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    if (!validateJson(newConfig)) {
      setStatus("Please fix JSON before submitting");
      return;
    }

    try {
      const parsed = JSON.parse(newConfig);
      await createDeviceConfig(secretData.secret, {
        deviceId: newDeviceId,
        config: parsed,
      });
      setStatus("✓ Config created");
      setNewDeviceId("");
      setNewConfig("{}");
      refetchConfigs();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleUpdateConfig = async (
    id: number,
    updatedConfig: Record<string, unknown>,
  ) => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    try {
      await updateDeviceConfig(secretData.secret, {
        id,
        config: updatedConfig,
      });
      setStatus("✓ Config updated");
      refetchConfigs();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    if (!confirm("Are you sure you want to delete this config?")) return;

    try {
      await deleteDeviceConfig(secretData.secret, { id });
      setStatus("✓ Config deleted");
      refetchConfigs();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Device Configs Admin</h1>

      <AdminSecretInput onSecretChange={setSecret} />

      {secretData?.isValid && (
        <>
          {configsLoading ? (
            <p className="text-muted-foreground">Loading device configs...</p>
          ) : configsError ? (
            <p className="text-red-600">
              Error loading device configs:{" "}
              {configsErrorData instanceof Error
                ? configsErrorData.message
                : "Unknown error"}
            </p>
          ) : configs && configs.length > 0 ? (
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
                        JSON.parse(e.target.value);
                      }}
                    />
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleUpdateConfig(config.id, config.config)
                      }
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteConfig(config.id)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No device configs found.</p>
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
                  onClick={handleCreateConfig}
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
              <CardTitle>Available Boards</CardTitle>
            </CardHeader>
            <CardContent>
              {boardsLoading ? (
                <p className="text-muted-foreground">Loading boards...</p>
              ) : boardsError ? (
                <p className="text-red-600">
                  Error loading boards:{" "}
                  {boardsErrorData instanceof Error
                    ? boardsErrorData.message
                    : "Unknown error"}
                </p>
              ) : boards && boards.length > 0 ? (
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
