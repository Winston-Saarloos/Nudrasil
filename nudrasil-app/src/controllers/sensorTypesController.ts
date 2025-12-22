import { axiosRequest } from "@/utils/axiosRequest";

interface SensorType {
  id: number;
  name: string;
}

interface CreateSensorTypeRequest {
  name: string;
}

interface DeleteSensorTypeRequest {
  id: number;
}

export async function fetchSensorTypes(secret?: string): Promise<SensorType[]> {
  try {
    const headers: Record<string, string> = {};
    if (secret?.trim()) {
      headers.Authorization = secret;
    }

    const request = await axiosRequest<{ data: SensorType[] }>({
      method: "GET",
      url: "/api/admin/sensor-types",
      headers,
    });

    if (request.success && request.value?.data) {
      return request.value.data;
    }

    throw new Error(request.message || "Failed to fetch sensor types");
  } catch (error: unknown) {
    console.error("Error fetching sensor types:", error);
    throw error;
  }
}

export async function createSensorType(
  accessToken: string,
  typeData: CreateSensorTypeRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "POST",
        url: "/api/admin/sensor-types",
        data: typeData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to create sensor type");
    }
  } catch (error: unknown) {
    console.error("Error creating sensor type:", error);
    throw error;
  }
}

export async function deleteSensorType(
  accessToken: string,
  typeData: DeleteSensorTypeRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "DELETE",
        url: "/api/admin/sensor-types",
        data: typeData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to delete sensor type");
    }
  } catch (error: unknown) {
    console.error("Error deleting sensor type:", error);
    throw error;
  }
}
