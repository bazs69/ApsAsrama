import { BusinessError } from "./businessErrors"

/**
 * Ensures an unknown error is converted to a BusinessError.
 * If it's already a BusinessError, it returns it unchanged.
 * Otherwise, it creates a new BusinessError.internal().
 */
export function normalizeBusinessError(error: unknown, fallbackMessage = "Internal Server Error"): BusinessError {
  if (error instanceof BusinessError) {
    return error
  }
  if (error instanceof Error) {
    return new BusinessError(error.message, "INTERNAL_ERROR")
  }
  return new BusinessError(fallbackMessage, "INTERNAL_ERROR")
}
