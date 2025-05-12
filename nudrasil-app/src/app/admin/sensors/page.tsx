"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
}

interface NewSensorInput {
  name: string;
  typeId: string;
  location: string;
  boardId: string;
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
  const [adminSecret, setAdminSecret] = useState("");

  useEffect(() => {
    const storedSecret = localStorage.getItem("admin_secret");
    if (storedSecret) {
      setAdminSecret(storedSecret);
    }
  }, []);

  useEffect(() => {
    if (adminSecret) {
      fetchData();
    }
  }, [adminSecret]);

  async function fetchData() {
    if (!adminSecret) return;

    const [sensorsRes, typesRes, boardsRes] = await Promise.all([
      fetch("/api/admin/sensors", { headers: { Authorization: adminSecret } }),
      fetch("/api/admin/sensor-types", {
        headers: { Authorization: adminSecret },
      }),
      fetch("/api/admin/boards", { headers: { Authorization: adminSecret } }),
    ]);

    const sensorsData: Sensor[] = await sensorsRes.json();
    const typesData: SensorType[] = await typesRes.json();
    const boardsData: { data: Board[] } = await boardsRes.json();

    setSensors(sensorsData);
    setTypes(typesData);
    if (boardsData) setBoards(boardsData.data);
  }

  async function createOrUpdateSensor() {
    const method = editingSensorId ? "PATCH" : "POST";
    const url = "/api/admin/sensors";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: adminSecret,
      },
      body: JSON.stringify({
        id: editingSensorId,
        ...newSensor,
      }),
    });

    setNewSensor({ name: "", typeId: "", location: "", boardId: "" });
    setEditingSensorId(null);
    fetchData();
  }

  async function deleteSensor(id: number) {
    await fetch("/api/admin/sensors", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminSecret,
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
    });
  }

  function cancelEditing() {
    setEditingSensorId(null);
    setNewSensor({ name: "", typeId: "", location: "", boardId: "" });
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Sensors Admin</h1>

      <div className="mb-6">
        <input
          type="password"
          placeholder="Enter Admin Secret"
          value={adminSecret}
          onChange={(e) => {
            setAdminSecret(e.target.value);
            localStorage.setItem("admin_secret", e.target.value);
          }}
          className="border p-2 rounded w-full"
        />
      </div>

      {adminSecret && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={newSensor.name}
              onChange={(e) =>
                setNewSensor({ ...newSensor, name: e.target.value })
              }
              placeholder="Sensor Name"
              className="border p-2 rounded"
            />
            <input
              value={newSensor.location}
              onChange={(e) =>
                setNewSensor({ ...newSensor, location: e.target.value })
              }
              placeholder="Sensor Location"
              className="border p-2 rounded"
            />
            <Select
              value={newSensor.typeId}
              onValueChange={(value) =>
                setNewSensor({ ...newSensor, typeId: value })
              }
            >
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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

            <Button onClick={createOrUpdateSensor}>
              {editingSensorId ? "Update Sensor" : "Add Sensor"}
            </Button>

            {editingSensorId && (
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            )}
          </div>

          {sensors && sensors.length > 0 && (
            <ul className="space-y-2">
              {sensors.map((sensor) => (
                <li
                  key={sensor.id}
                  className="border p-2 rounded flex justify-between items-center"
                >
                  <div>
                    <div>{sensor.name}</div>
                    <hr />
                    <div>Board ID: {sensor.boardId}</div>
                    <div>Location: {sensor.location}</div>
                    <div>Type: {sensor.typeId}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => startEditing(sensor)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteSensor(sensor.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
