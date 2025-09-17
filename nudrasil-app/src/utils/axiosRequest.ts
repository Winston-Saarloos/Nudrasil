import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from "axios";

import { GenericResponse } from "@/models/GenericResponseTmp";

const instance = axios.create({});

/* eslint-disable @typescript-eslint/no-explicit-any */
export function isAxiosError(error: any): error is AxiosError {
  return error.isAxiosError === true;
}

export async function AxiosRequest<T>(
  requestOptions: AxiosRequestConfig,
): Promise<GenericResponse<T>> {
  try {
    const response: AxiosResponse<T> = await instance(requestOptions);

    return {
      Success: true,
      Value: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError;

    return {
      Success: false,
      Error: axiosError.response?.status.toString() || null,
      Message: axiosError.response?.statusText || axiosError.message,
      Value: null as T,
    };
  }
}
