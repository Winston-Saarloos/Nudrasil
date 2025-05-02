"use client";

import { useEffect, useState } from "react";
import { Board } from "@/models/board";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const storedSecret = localStorage.getItem("admin_secret");
    if (storedSecret) {
      setSecret(storedSecret);
    }
  }, []);

  useEffect(() => {
    if (secret) {
      fetchBoards();
    }
  }, [secret]);

  const fetchBoards = async () => {
    const res = await fetch("/api/admin/boards", {
      headers: {
        Authorization: secret,
      },
    });

    let result = null;
    try {
      const text = await res.text();
      if (text) {
        result = JSON.parse(text);
      }
    } catch (e) {
      console.error("Failed to parse boards response:", e);
    }

    if (res.ok && result?.data) {
      setBoards(result.data);
    } else {
      console.error("Failed to load boards", result);
    }
  };

  const createBoard = async () => {
    const res = await fetch("/api/admin/boards", {
      method: "POST",
      body: JSON.stringify({ name, location }),
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
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

    if (res.ok) {
      setStatus("✅ Board created");
      setName("");
      setLocation("");
      fetchBoards();
    } else {
      setStatus(`❌ ${result?.error || "Unknown error"}`);
    }
  };

  const updateBoard = async () => {
    const res = await fetch("/api/admin/boards", {
      method: "PATCH",
      body: JSON.stringify({ id: editId, name, location }),
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
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

    if (res.ok) {
      setStatus("✅ Board updated");
      setName("");
      setLocation("");
      setEditId(null);
      fetchBoards();
    } else {
      setStatus(`❌ ${result?.error || "Unknown error"}`);
    }
  };

  const deleteBoard = async (id: number) => {
    const res = await fetch("/api/admin/boards", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
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

    if (res.ok) {
      setStatus("✅ Board deleted");
      fetchBoards();
    } else {
      setStatus(`❌ ${result?.error || "Unknown error"}`);
    }
  };

  const startEdit = (board: Board) => {
    setEditId(board.id);
    setName(board.name);
    setLocation(board.location);
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-xl font-bold">
        {editId ? "Edit Board" : "Create Board"}
      </h2>

      <input
        placeholder="Admin Secret"
        type="password"
        className="w-full border p-2"
        value={secret}
        onChange={(e) => {
          setSecret(e.target.value);
          localStorage.setItem("admin_secret", e.target.value);
        }}
      />

      {secret && (
        <>
          <input
            placeholder="Name"
            className="w-full border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Location"
            className="w-full border p-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button
            onClick={editId ? updateBoard : createBoard}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editId ? "Update Board" : "Create Board"}
          </button>
          {status && <p>{status}</p>}
          <hr className="my-6" />
          <h3 className="font-bold">Boards:</h3>
          <ul className="space-y-2">
            {boards.map((b) => (
              <li key={b.id} className="border p-2 rounded">
                <strong>{b.name}</strong> – {b.location} - [ {b.id} ]
                <button
                  className="ml-2 text-sm text-blue-600 underline"
                  onClick={() => startEdit(b)}
                >
                  Edit
                </button>
                <button
                  className="ml-2 text-sm text-red-600 underline"
                  onClick={() => {
                    if (confirm(`Delete board "${b.name}"?`)) {
                      deleteBoard(b.id);
                    }
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
