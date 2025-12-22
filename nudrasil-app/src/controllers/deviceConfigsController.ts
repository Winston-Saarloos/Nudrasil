import { axiosRequest } from "@/utils/axiosRequest";

interface DeviceConfig {
  id: number;
  device_id: string;
  config: Record<string, unknown>;
}

interface CreateDeviceConfigRequest {
  deviceId: string;
  config: Record<string, unknown>;
}

interface UpdateDeviceConfigRequest {
  id: number;
  config: Record<string, unknown>;
}

interface DeleteDeviceConfigRequest {
  id: number;
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  try {
    const request = await axiosRequest<{ data: DeviceConfig[] }>({
      method: "GET",
      url: "/api/admin/device-configs",
    });

    if (request.success && request.value) {
      return request.value.data;
    }

    throw new Error(request.message || "Failed to fetch device configs");
  } catch (error: unknown) {
    console.error("Error fetching device configs:", error);
    throw error;
  }
}

export async function createDeviceConfig(
  accessToken: string,
  configData: CreateDeviceConfigRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "POST",
        url: "/api/admin/device-configs",
        data: configData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to create device config");
    }
  } catch (error: unknown) {
    console.error("Error creating device config:", error);
    throw error;
  }
}

export async function updateDeviceConfig(
  accessToken: string,
  configData: UpdateDeviceConfigRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "PATCH",
        url: "/api/admin/device-configs",
        data: configData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to update device config");
    }
  } catch (error: unknown) {
    console.error("Error updating device config:", error);
    throw error;
  }
}

export async function deleteDeviceConfig(
  accessToken: string,
  configData: DeleteDeviceConfigRequest,
): Promise<void> {
  try {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const request = await axiosRequest(
      {
        method: "DELETE",
        url: "/api/admin/device-configs",
        data: configData,
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
    );

    if (!request.success) {
      throw new Error(request.message || "Failed to delete device config");
    }
  } catch (error: unknown) {
    console.error("Error deleting device config:", error);
    throw error;
  }
}
