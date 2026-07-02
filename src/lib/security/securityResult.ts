/**
 * Security Result
 * 
 * Factory functions to build standardized SecureResult objects.
 * Ensures all server actions return a consistent shape.
 */

import { type SecureResult } from "./securityTypes"
import { type SecurityErrorCode } from "./securityConstants"
import { mapSecurityError } from "./securityErrors"

export function secureSuccess<T>(data: T, requestId: string): SecureResult<T> {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(data as any),
    success: true,
    requestId,
    timestamp: Date.now(),
  }
}

export function secureFailure(
  errorCode: SecurityErrorCode,
  requestId: string,
  overrideDescription?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): SecureResult<any> {
  const mapped = mapSecurityError(errorCode, overrideDescription)
  return {
    success: false,
    error: mapped.description,
    errorCode,
    requestId,
    timestamp: Date.now(),
  }
}
