"use client";

import { useState } from "react";

import { Board } from "@models/Board";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import AdminSecretInput from "@components/AdminSecretInput";
import useAdminSecretValidation from "@hooks/useAdminSecretValidation";
import { useBoards } from "@hooks/useBoards";
import {
  createBoard,
  updateBoard,
  deleteBoard,
} from "@/controllers/boardsController";

export default function BoardsPage() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [secret, setSecret] = useState("");

  const { data: secretData } = useAdminSecretValidation(secret);
  const {
    data: boards = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBoards(secretData?.isValid || false);

  const handleCreateBoard = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    try {
      await createBoard(secretData.secret, { name, location });
      setStatus("✓ Board created");
      setName("");
      setLocation("");
      refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleUpdateBoard = async () => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    if (!editId) {
      setStatus("No board selected for editing");
      return;
    }

    try {
      await updateBoard(secretData.secret, { id: editId, name, location });
      setStatus("✓ Board updated");
      setName("");
      setLocation("");
      setEditId(null);
      refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteBoard = async (id: number) => {
    if (!secretData?.secret || !secretData?.isValid) {
      setStatus("Invalid admin secret");
      return;
    }

    try {
      await deleteBoard(secretData.secret, { id });
      setStatus("✓ Board deleted");
      refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown error");
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
                  onClick={editId ? handleUpdateBoard : handleCreateBoard}
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
              {isLoading ? (
                <p className="text-muted-foreground">Loading boards...</p>
              ) : isError ? (
                <p className="text-red-600">
                  Error loading boards:{" "}
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              ) : boards.length > 0 ? (
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
                                handleDeleteBoard(board.id);
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
