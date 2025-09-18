"use client";

import { useEffect, useState } from "react";
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

interface SensorType {
  id: number;
  name: string;
}

interface Board {
  id: number;
  name: string;
}

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
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [types, setTypes] = useState<SensorType[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newSensor, setNewSensor] = useState<NewSensorInput>({
    name: "",
    typeId: "",
    location: "",
    boardId: "",
  });
  const [editingSensorId, setEditingSensorId] = useState<number | null>(null);
  const [secret, setSecret] = useState("");

  const { data: secretData } = useAdminSecretValidation(secret);

  useEffect(() => {
    if (secretData?.isValid) {
      fetchData();
    }
  }, [secretData]);

  async function fetchData() {
    if (!secretData?.secret || !secretData?.isValid) return;

    const [sensorsRes, typesRes, boardsRes] = await Promise.all([
      fetch("/api/admin/sensors", {
        headers: { Authorization: secretData.secret },
      }),
      fetch("/api/admin/sensor-types", {
        headers: { Authorization: secretData.secret },
      }),
      fetch("/api/admin/boards", {
        headers: { Authorization: secretData.secret },
      }),
    ]);

    const sensorsData: Sensor[] = await sensorsRes.json();
    const typesData: SensorType[] = await typesRes.json();
    const boardsData: { data: Board[] } = await boardsRes.json();

    setSensors(sensorsData);
    setTypes(typesData);
    if (boardsData) setBoards(boardsData.data);
  }

  async function createOrUpdateSensor() {
    if (!secretData?.secret || !secretData?.isValid) {
      return;
    }

    const method = editingSensorId ? "PATCH" : "POST";
    const url = "/api/admin/sensors";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
      body: JSON.stringify({
        id: editingSensorId,
        ...newSensor,
        minCalibratedValue: newSensor.minCalibratedValue
          ? parseFloat(newSensor.minCalibratedValue)
          : null,
        maxCalibratedValue: newSensor.maxCalibratedValue
          ? parseFloat(newSensor.maxCalibratedValue)
          : null,
      }),
    });

    setNewSensor({ name: "", typeId: "", location: "", boardId: "" });
    setEditingSensorId(null);
    fetchData();
  }

  async function deleteSensor(id: number) {
    if (!secretData?.secret || !secretData?.isValid) {
      return;
    }

    await fetch("/api/admin/sensors", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

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
                  onClick={createOrUpdateSensor}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Sensors</CardTitle>
            </CardHeader>
            <CardContent>
              {sensors && sensors.length > 0 ? (
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
                            onClick={() => deleteSensor(sensor.id)}
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
