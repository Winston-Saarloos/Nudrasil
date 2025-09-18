import { NextResponse } from "next/server";
import { GenericResponse } from "@/models/GenericResponse";

interface ApiResponseOptions {
  status?: number;
  errorId?: string;
}

/**
 * Creates a standardized API response following the GenericResponse structure
 */
export function createApiResponse<T>(
  value: T,
  options: ApiResponseOptions = {},
): NextResponse<GenericResponse<T>> {
  const { status = 200, errorId } = options;

  const response: GenericResponse<T> = {
    success: true,
    value: value,
    status: status,
    ...(errorId && { errorId: errorId }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized error response following the GenericResponse structure
 */
export function createApiError(
  message: string,
  status: number = 400,
  errorId?: string,
): NextResponse<GenericResponse<null>> {
  const response: GenericResponse<null> = {
    success: false,
    error: status.toString(),
    message: message,
    value: null,
    status: status,
    ...(errorId && { errorId: errorId }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized unauthorized response
 */
export function createUnauthorizedResponse(
  message: string = "Unauthorized",
): NextResponse<GenericResponse<null>> {
  return createApiError(message, 401);
}
