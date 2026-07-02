/**
 * Security Constants
 * 
 * Single Source of Truth for all security-related codes, strings, and values.
 * No magic strings or numbers are allowed in the Security Layer.
 */

export const SECURITY_CONSTANTS = {
  VERSION: "1.0.0",
  
  ERROR_CODES: {
    // Authentication errors
    AUTH_001: "AUTH_001", // Not authenticated / no session
    AUTH_002: "AUTH_002", // Session expired
    AUTH_003: "AUTH_003", // Invalid session format

    // Authorization errors
    AUTHZ_001: "AUTHZ_001", // Insufficient permission (one)
    AUTHZ_002: "AUTHZ_002", // Insufficient permission (any)
    AUTHZ_003: "AUTHZ_003", // Insufficient permission (all)
    AUTHZ_004: "AUTHZ_004", // Role mismatch

    // Validation errors
    VALIDATION_001: "VALIDATION_001", // General validation failure
    VALIDATION_002: "VALIDATION_002", // Duplicate / conflict resource
    VALIDATION_003: "VALIDATION_003", // Resource not found

    // Rate limit
    RATE_001: "RATE_001", // Too many requests

    // System errors
    SYSTEM_001: "SYSTEM_001", // Unexpected internal error
  },
  
  AUDIT_STATUS: {
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
  } as const,
} as const

export type SecurityErrorCode = typeof SECURITY_CONSTANTS.ERROR_CODES[keyof typeof SECURITY_CONSTANTS.ERROR_CODES]
