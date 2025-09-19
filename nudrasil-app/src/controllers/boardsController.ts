import { axiosRequest } from "@/utils/axiosRequest";
import { Board } from "@models/Board";

interface CreateBoardRequest {
  name: string;
  location: string;
}

interface UpdateBoardRequest {
  id: number;
  name: string;
  location: string;
}

interface DeleteBoardRequest {
  id: number;
}

interface BoardsResponse {
  data: Board[];
}

export async function fetchBoards(secret: string): Promise<Board[]> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest<BoardsResponse>({
      method: "GET",
      url: "/api/admin/boards",
      headers: {
        Authorization: secret,
      },
    });

    if (request.success && request.value?.data) {
      return request.value.data;
    }

    throw new Error(request.message || "Failed to fetch boards");
  } catch (error: unknown) {
    console.error("Error fetching boards:", error);
    throw error;
  }
}

export async function createBoard(
  secret: string,
  boardData: CreateBoardRequest,
): Promise<void> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest({
      method: "POST",
      url: "/api/admin/boards",
      data: boardData,
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
      },
    });

    if (!request.success) {
      throw new Error(request.message || "Failed to create board");
    }
  } catch (error: unknown) {
    console.error("Error creating board:", error);
    throw error;
  }
}

export async function updateBoard(
  secret: string,
  boardData: UpdateBoardRequest,
): Promise<void> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest({
      method: "PATCH",
      url: "/api/admin/boards",
      data: boardData,
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
      },
    });

    if (!request.success) {
      throw new Error(request.message || "Failed to update board");
    }
  } catch (error: unknown) {
    console.error("Error updating board:", error);
    throw error;
  }
}

export async function deleteBoard(
  secret: string,
  boardData: DeleteBoardRequest,
): Promise<void> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest({
      method: "DELETE",
      url: "/api/admin/boards",
      data: boardData,
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
      },
    });

    if (!request.success) {
      throw new Error(request.message || "Failed to delete board");
    }
  } catch (error: unknown) {
    console.error("Error deleting board:", error);
    throw error;
  }
}

export interface BoardStatus {
  id: number;
  name: string;
  status: "healthy" | "unreachable" | "invalid-response";
  latencyMs: number | null;
}

interface BoardStatusResponse {
  data: BoardStatus[];
}

export async function fetchBoardStatus(): Promise<BoardStatus[]> {
  try {
    const request = await axiosRequest<BoardStatusResponse>({
      method: "GET",
      url: "/api/boards/status",
    });

    if (request.success && request.value?.data) {
      return request.value.data;
    }

    throw new Error(request.message || "Failed to fetch board status");
  } catch (error: unknown) {
    console.error("Error fetching board status:", error);
    throw error;
  }
}
