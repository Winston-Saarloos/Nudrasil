/* eslint-disable @typescript-eslint/no-explicit-any */
export interface GenericResponse<T = any> {
  Success: boolean;
  Error?: string | null;
  ErrorId?: string | null;
  Message?: string | null;
  Value: T;
}
