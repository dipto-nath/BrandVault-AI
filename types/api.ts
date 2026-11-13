export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function apiError(code: string, message: string, details?: unknown): ApiError {
  return { success: false, error: { code, message, details } };
}
