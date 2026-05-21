import type { Response } from "express";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_COORDINATES"
  | "CONFLICT_OPEN_JOB"
  | "DUPLICATE_EMAIL"
  | "INVALID_STATE_TRANSITION"
  | "INCOMPATIBLE_VEHICLE"
  | "ALREADY_REVIEWED"
  | "RATE_LIMITED"
  | "DB_UNAVAILABLE"
  | "DB_NOT_READY"
  | "INTERNAL";

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}
