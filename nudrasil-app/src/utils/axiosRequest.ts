import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import { GenericResponse } from "@/models/GenericResponse";

const httpClient: AxiosInstance = axios.create({
  timeout: 15000,
  // only network/timeout/cancel will throw.
  validateStatus: () => true,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
export function isAxiosError(error: any): error is AxiosError {
  return error.isAxiosError === true;
}

function isGenericResponse(obj: any): obj is GenericResponse<any> {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.success === "boolean" &&
    "value" in obj
  );
}

export async function axiosRequest<T = unknown>(
  requestConfig: AxiosRequestConfig,
): Promise<GenericResponse<T>> {
  try {
    const axiosResponse: AxiosResponse =
      await httpClient.request(requestConfig);
    const { status, statusText, data } = axiosResponse;

    const isOk = status >= 200 && status < 300;

    if (isOk) {
      if (isGenericResponse(data)) {
        return data as GenericResponse<T>;
      }

      return {
        success: true,
        value: data as T,
        status,
      };
    }

    // Normalize non 200
    return {
      success: false,
      value: null,
      status,
      error: String(status),
      message: statusText || "Request failed",
    };
  } catch (unknownError) {
    if (axios.isAxiosError(unknownError)) {
      const axiosError = unknownError as AxiosError;
      return {
        success: false,
        value: null,
        status: axiosError.response?.status,
        error: axiosError.code ?? "NETWORK_ERROR",
        message: axiosError.message,
      };
    }

    const fallbackMessage =
      unknownError instanceof Error ? unknownError.message : "Unknown error";
    return {
      success: false,
      value: null,
      error: "UNKNOWN_ERROR",
      message: fallbackMessage,
    };
  }
}
