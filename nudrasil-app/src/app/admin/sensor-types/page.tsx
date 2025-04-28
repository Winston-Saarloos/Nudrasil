"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SensorType {
  id: number;
  name: string;
}

export default function SensorTypesAdminPage() {
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [adminSecret, setAdminSecret] = useState("");

  useEffect(() => {
    const storedSecret = localStorage.getItem("admin_secret");
    if (storedSecret) {
      setAdminSecret(storedSecret);
    }
  }, []);

  useEffect(() => {
    if (adminSecret) {
      fetchTypes();
    }
  }, [adminSecret]);

  async function fetchTypes() {
    if (!adminSecret) return;
    const res = await fetch("/api/admin/sensor-types", {
      headers: { Authorization: adminSecret },
    });
    const data: SensorType[] = await res.json();
    setSensorTypes(data);
  }

  async function createType() {
    if (!newTypeName.trim()) return;
    await fetch("/api/admin/sensor-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminSecret,
      },
      body: JSON.stringify({ name: newTypeName }),
    });
    setNewTypeName("");
    fetchTypes();
  }

  async function deleteType(id: number) {
    await fetch("/api/admin/sensor-types", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminSecret,
      },
      body: JSON.stringify({ id }),
    });
    fetchTypes();
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Sensor Types Admin</h1>

      <div className="mb-6">
        <Input
          type="password"
          placeholder="Enter Admin Secret"
          value={adminSecret}
          onChange={(e) => {
            setAdminSecret(e.target.value);
            localStorage.setItem("admin_secret", e.target.value);
          }}
        />
      </div>

      {adminSecret && (
        <>
          <div className="flex gap-2 mb-4">
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="New Type Name"
            />
            <Button onClick={createType}>Add Type</Button>
          </div>

          <ul className="space-y-2">
            {sensorTypes.map((type) => (
              <li
                key={type.id}
                className="border p-2 rounded flex justify-between"
              >
                {type.name}
                <Button
                  variant="destructive"
                  onClick={() => deleteType(type.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
