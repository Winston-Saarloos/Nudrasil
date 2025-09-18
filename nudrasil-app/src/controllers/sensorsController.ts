import { axiosRequest } from "@/utils/axiosRequest";

interface Sensor {
  id: number;
  name: string;
  location: string;
  typeId: number;
  boardId: number | null;
  minCalibratedValue?: number | null;
  maxCalibratedValue?: number | null;
}

interface CreateSensorRequest {
  name: string;
  location: string;
  typeId: number;
  boardId: number;
  minCalibratedValue?: number | null;
  maxCalibratedValue?: number | null;
}

interface UpdateSensorRequest {
  id: number;
  name: string;
  location: string;
  typeId: number;
  boardId: number;
  minCalibratedValue?: number | null;
  maxCalibratedValue?: number | null;
}

interface DeleteSensorRequest {
  id: number;
}

export async function fetchSensors(secret: string): Promise<Sensor[]> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest<{ data: Sensor[] }>({
      method: "GET",
      url: "/api/admin/sensors",
      headers: {
        Authorization: secret,
      },
    });

    if (request.success && request.value?.data) {
      return request.value.data;
    }

    throw new Error(request.message || "Failed to fetch sensors");
  } catch (error: unknown) {
    console.error("Error fetching sensors:", error);
    throw error;
  }
}

export async function createSensor(
  secret: string,
  sensorData: CreateSensorRequest,
): Promise<void> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest({
      method: "POST",
      url: "/api/admin/sensors",
      data: sensorData,
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
      },
    });

    if (!request.success) {
      throw new Error(request.message || "Failed to create sensor");
    }
  } catch (error: unknown) {
    console.error("Error creating sensor:", error);
    throw error;
  }
}

export async function updateSensor(
  secret: string,
  sensorData: UpdateSensorRequest,
): Promise<void> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest({
      method: "PATCH",
      url: "/api/admin/sensors",
      data: sensorData,
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
      },
    });

    if (!request.success) {
      throw new Error(request.message || "Failed to update sensor");
    }
  } catch (error: unknown) {
    console.error("Error updating sensor:", error);
    throw error;
  }
}

export async function deleteSensor(
  secret: string,
  sensorData: DeleteSensorRequest,
): Promise<void> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest({
      method: "DELETE",
      url: "/api/admin/sensors",
      data: sensorData,
      headers: {
        "Content-Type": "application/json",
        Authorization: secret,
      },
    });

    if (!request.success) {
      throw new Error(request.message || "Failed to delete sensor");
    }
  } catch (error: unknown) {
    console.error("Error deleting sensor:", error);
    throw error;
  }
}
