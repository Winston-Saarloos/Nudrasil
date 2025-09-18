"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import AdminSecretInput from "@components/AdminSecretInput";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";
import { useSensors } from "@hooks/useSensors";
import { useSensorTypes } from "@hooks/useSensorTypes";
import { useBoards } from "@hooks/useBoards";
import {
  createSensor,
  updateSensor,
  deleteSensor,
} from "@/controllers/sensorsController";

interface Sensor {
  id: number;
  name: string;
  location: string;
  typeId: number;
  boardId: number | null;
  minCalibratedValue?: number | null;
  maxCalibratedValue?: number | null;
}

interface NewSensorInput {
  name: string;
  typeId: string;
  location: string;
  boardId: string;
  minCalibratedValue?: string;
  maxCalibratedValue?: string;
}

export default function SensorsAdminPage() {
  const [newSensor, setNewSensor] = useState<NewSensorInput>({
    name: "",
    typeId: "",
    location: "",
    boardId: "",
  });
  const [editingSensorId, setEditingSensorId] = useState<number | null>(null);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const { data: secretData } = useAdminSecretValidation(secret);
  const {
    data: sensors = [],
    isLoading: sensorsLoading,
    isError: sensorsError,
    error: sensorsErrorData,
    refetch: refetchSensors,
  } = useSensors(secretData?.isValid || false);
  const { data: types = [] } = useSensorTypes(secretData?.isValid || false);
  const { data: boards = [] } = useBoards(secretData?.isValid || false);

  const handleCreateOrUpdateSensor = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    try {
      const sensorData = {
        name: newSensor.name,
        location: newSensor.location,
        typeId: parseInt(newSensor.typeId),
        boardId: parseInt(newSensor.boardId),
        minCalibratedValue: newSensor.minCalibratedValue
          ? parseFloat(newSensor.minCalibratedValue)
          : null,
        maxCalibratedValue: newSensor.maxCalibratedValue
          ? parseFloat(newSensor.maxCalibratedValue)
          : null,
      };

      if (editingSensorId) {
        await updateSensor(secretData.secret, {
          id: editingSensorId,
          ...sensorData,
        });
        setStatus("✓ Sensor updated");
      } else {
        await createSensor(secretData.secret, sensorData);
        setStatus("✓ Sensor created");
      }

      setNewSensor({ name: "", typeId: "", location: "", boardId: "" });
      setEditingSensorId(null);
      refetchSensors();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteSensor = async (id: number) => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    try {
      await deleteSensor(secretData.secret, { id });
      setStatus("✓ Sensor deleted");
      refetchSensors();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  function startEditing(sensor: Sensor) {
    setEditingSensorId(sensor.id);
    setNewSensor({
      name: sensor.name,
      location: sensor.location,
      typeId: sensor.typeId.toString(),
      boardId: sensor.boardId?.toString() ?? "",
      minCalibratedValue: sensor.minCalibratedValue?.toString() ?? "",
      maxCalibratedValue: sensor.maxCalibratedValue?.toString() ?? "",
    });
  }

  function cancelEditing() {
    setEditingSensorId(null);
    setNewSensor({ name: "", typeId: "", location: "", boardId: "" });
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Sensors Admin</h1>

      <AdminSecretInput onSecretChange={setSecret} />

      {secretData?.isValid && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingSensorId ? "Edit Sensor" : "Create New Sensor"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={newSensor.name}
                  onChange={(e) =>
                    setNewSensor({ ...newSensor, name: e.target.value })
                  }
                  placeholder="Sensor Name"
                />
                <Input
                  value={newSensor.location}
                  onChange={(e) =>
                    setNewSensor({ ...newSensor, location: e.target.value })
                  }
                  placeholder="Sensor Location"
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Min Calibrated Value"
                  value={newSensor.minCalibratedValue ?? ""}
                  onChange={(e) =>
                    setNewSensor({
                      ...newSensor,
                      minCalibratedValue: e.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Max Calibrated Value"
                  value={newSensor.maxCalibratedValue ?? ""}
                  onChange={(e) =>
                    setNewSensor({
                      ...newSensor,
                      maxCalibratedValue: e.target.value,
                    })
                  }
                />
                <Select
                  value={newSensor.typeId}
                  onValueChange={(value) =>
                    setNewSensor({ ...newSensor, typeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  {types && types.length > 0 && (
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
                <Select
                  value={newSensor.boardId}
                  onValueChange={(value) =>
                    setNewSensor({ ...newSensor, boardId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Board" />
                  </SelectTrigger>
                  {boards && boards.length > 0 && (
                    <SelectContent>
                      {boards.map((board) => (
                        <SelectItem key={board.id} value={board.id.toString()}>
                          {board.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateOrUpdateSensor}
                  disabled={
                    !newSensor.name.trim() ||
                    !newSensor.location.trim() ||
                    !newSensor.typeId ||
                    !newSensor.boardId
                  }
                >
                  {editingSensorId ? "Update Sensor" : "Add Sensor"}
                </Button>
                {editingSensorId && (
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                )}
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
              <CardTitle>Existing Sensors</CardTitle>
            </CardHeader>
            <CardContent>
              {sensorsLoading ? (
                <p className="text-muted-foreground">Loading sensors...</p>
              ) : sensorsError ? (
                <p className="text-red-600">
                  Error loading sensors:{" "}
                  {sensorsErrorData instanceof Error
                    ? sensorsErrorData.message
                    : "Unknown error"}
                </p>
              ) : sensors && sensors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sensors.map((sensor) => (
                    <Card key={sensor.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{sensor.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Location: {sensor.location}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Board ID: {sensor.boardId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Type ID: {sensor.typeId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Calibrated Range:{" "}
                            {sensor.minCalibratedValue ?? "??"} to{" "}
                            {sensor.maxCalibratedValue ?? "??"}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startEditing(sensor)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSensor(sensor.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No sensors found.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
