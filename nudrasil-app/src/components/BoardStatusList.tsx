"use client";

import { useBoardStatus } from "@/hooks/useBoardStatus";
import { StatusList } from "@/components/ui/status-indicator";
import { BoardStatus } from "@/controllers/boardsController";

export function BoardStatusList() {
  const { data: boardStatusList, isLoading, error } = useBoardStatus();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <div className="text-sm text-gray-400">Loading board status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <div className="text-sm text-red-400">
          Error loading board status: {error.message}
        </div>
      </div>
    );
  }

  if (!boardStatusList || boardStatusList.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Board Status</h2>
        <div className="text-sm text-gray-400">No boards found</div>
      </div>
    );
  }

  const statusItems = boardStatusList.map((board: BoardStatus) => ({
    status: board.status,
    label: board.name,
    description: `Board ID: ${board.id}`,
    latencyMs: board.latencyMs,
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Board Status</h2>
      <StatusList items={statusItems} />
    </div>
  );
}
