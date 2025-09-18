import { axiosRequest } from "@/utils/axiosRequest";

interface SensorType {
  id: number;
  name: string;
}

export async function fetchSensorTypes(secret: string): Promise<SensorType[]> {
  try {
    if (!secret.trim()) {
      throw new Error("Admin secret is required");
    }

    const request = await axiosRequest<SensorType[]>({
      method: "GET",
      url: "/api/admin/sensor-types",
      headers: {
        Authorization: secret,
      },
    });

    if (request.success && request.value) {
      return request.value;
    }

    throw new Error(request.message || "Failed to fetch sensor types");
  } catch (error: unknown) {
    console.error("Error fetching sensor types:", error);
    throw error;
  }
}
