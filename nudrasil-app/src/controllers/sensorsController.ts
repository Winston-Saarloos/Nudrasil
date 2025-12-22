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

export async function fetchSensors(): Promise<Sensor[]> {
  try {
    const request = await axiosRequest<{ data: Sensor[] }>({
      method: "GET",
      url: "/api/admin/sensors",
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
  accessToken: string,
  sensorData: CreateSensorRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "POST",
        url: "/api/admin/sensors",
        data: sensorData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to create sensor");
    }
  } catch (error: unknown) {
    console.error("Error creating sensor:", error);
    throw error;
  }
}

export async function updateSensor(
  accessToken: string,
  sensorData: UpdateSensorRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "PATCH",
        url: "/api/admin/sensors",
        data: sensorData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to update sensor");
    }
  } catch (error: unknown) {
    console.error("Error updating sensor:", error);
    throw error;
  }
}

export async function deleteSensor(
  accessToken: string,
  sensorData: DeleteSensorRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "DELETE",
        url: "/api/admin/sensors",
        data: sensorData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to delete sensor");
    }
  } catch (error: unknown) {
    console.error("Error deleting sensor:", error);
    throw error;
  }
}
