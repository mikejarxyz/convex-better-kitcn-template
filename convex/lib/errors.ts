import { ConvexError } from "convex/values";

/** Cross-cutting HTTP-aligned errors. Domain-specific codes live in `<domain>_impl/errors.ts`. */
export const appErrors = {
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    message: "Not authorized",
    httpStatus: 401,
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    message: "Forbidden",
    httpStatus: 403,
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Resource not found",
    httpStatus: 404,
  },
  INVALID: {
    code: "INVALID",
    message: "Invalid request",
    httpStatus: 400,
  },
  CONFLICT: {
    code: "CONFLICT",
    message: "Conflict",
    httpStatus: 409,
  },
  INTERNAL: {
    code: "INTERNAL",
    message: "Internal server error",
    httpStatus: 500,
  },
} as const;

export type AppErrorCode = keyof typeof appErrors;
type AppErrorBase = (typeof appErrors)[AppErrorCode];

/** Shared shape for app and domain error catalogs. */
export type AppError = Omit<AppErrorBase, "message"> & { message: string };

export function appError(
  code: AppErrorCode,
  messageOverride?: string,
): AppError {
  const base = appErrors[code];
  return {
    ...base,
    message: messageOverride ?? base.message,
  };
}

/** Throw any catalog entry (app or domain) with the same structured payload. */
export function throwConvexError(error: AppError): never {
  throw new ConvexError(error);
}

export function throwAppError(
  code: AppErrorCode,
  messageOverride?: string,
): never {
  throwConvexError(appError(code, messageOverride));
}

export function isAppError(error: unknown): error is ConvexError<AppError> {
  return (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    "message" in error.data &&
    "httpStatus" in error.data
  );
}
