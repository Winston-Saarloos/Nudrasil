"use client";

import { useEffect, useState, useCallback } from "react";

import { Board } from "@models/Board";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import AdminSecretInput from "@components/AdminSecretInput";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [secret, setSecret] = useState("");

  const { data: secretData } = useAdminSecretValidation(secret);

  const fetchBoards = useCallback(async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      return;
    }

    const res = await fetch("/api/admin/boards", {
      headers: {
        Authorization: secretData.secret,
      },
    });

    let result = null;
    try {
      const text = await res.text();
      if (text) {
        result = JSON.parse(text);
      }
    } catch (error) {
      console.error("Failed to parse boards response:", error);
    }

    if (res.ok && result?.success && result?.value?.data) {
      setBoards(result.value.data);
    } else {
      console.error("Failed to load boards", result);
    }
  }, [secretData]);

  useEffect(() => {
    if (secretData?.isValid) {
      fetchBoards();
    }
  }, [fetchBoards, secretData]);

  const createBoard = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    const res = await fetch("/api/admin/boards", {
      method: "POST",
      body: JSON.stringify({ name, location }),
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
    });

    let result = null;
    try {
      const text = await res.text();
      if (text) {
        result = JSON.parse(text);
      }
    } catch (e) {
      console.error("Failed to parse response JSON:", e);
    }

    if (res.ok && result?.success) {
      setStatus("✓  Board created");
      setName("");
      setLocation("");
      fetchBoards();
    } else {
      setStatus(`${result?.message || "Unknown error"}`);
    }
  };

  const updateBoard = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    const res = await fetch("/api/admin/boards", {
      method: "PATCH",
      body: JSON.stringify({ id: editId, name, location }),
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
    });

    let result = null;
    try {
      const text = await res.text();
      if (text) {
        result = JSON.parse(text);
      }
    } catch (e) {
      console.error("Failed to parse response JSON:", e);
    }

    if (res.ok && result?.success) {
      setStatus("✓ Board updated");
      setName("");
      setLocation("");
      setEditId(null);
      fetchBoards();
    } else {
      setStatus(`${result?.message || "Unknown error"}`);
    }
  };

  const deleteBoard = async (id: number) => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    const res = await fetch("/api/admin/boards", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: secretData.secret,
      },
    });

    let result = null;
    try {
      const text = await res.text();
      if (text) {
        result = JSON.parse(text);
      }
    } catch (e) {
      console.error("Failed to parse response JSON:", e);
    }

    if (res.ok && result?.success) {
      setStatus("✓ Board deleted");
      fetchBoards();
    } else {
      setStatus(`${result?.message || "Unknown error"}`);
    }
  };

  const startEdit = (board: Board) => {
    setEditId(board.id);
    setName(board.name);
    setLocation(board.location);
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Boards Admin</h1>

      <AdminSecretInput onSecretChange={setSecret} />

      {secretData?.isValid && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {editId ? "Edit Board" : "Create New Board"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Board Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editId ? updateBoard : createBoard}
                  disabled={!name.trim() || !location.trim()}
                >
                  {editId ? "Update Board" : "Create Board"}
                </Button>
                {editId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditId(null);
                      setName("");
                      setLocation("");
                    }}
                  >
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
              <CardTitle>Existing Boards</CardTitle>
            </CardHeader>
            <CardContent>
              {boards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boards.map((board) => (
                    <Card key={board.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{board.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Location: {board.location}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {board.id}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startEdit(board)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete board "${board.name}"?`)) {
                                deleteBoard(board.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
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
