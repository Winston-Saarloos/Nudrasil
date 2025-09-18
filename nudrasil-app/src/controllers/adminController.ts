import { axiosRequest } from "@/utils/axiosRequest";

interface ValidationResponse {
  isValid: boolean;
}

export async function validateAdminSecret(secret: string): Promise<boolean> {
  try {
    if (!secret.trim()) {
      return false;
    }

    const request = await axiosRequest<ValidationResponse>({
      method: "GET",
      url: "/api/admin/validate",
      headers: {
        Authorization: secret,
      },
    });

    if (request.success && request.value) {
      return request.value.isValid;
    }

    return false;
  } catch (error: unknown) {
    console.error("Unexpected error validating admin secret:", error);
    return false;
  }
}
