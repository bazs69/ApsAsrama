/**
 * Audit Action Constants
 *
 * Centralized definitions for all security audit event actions.
 * Using constants avoids free-form strings and ensures consistency
 * across the application.
 */

export const AuditAction = {
  // Authentication
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGIN_RATE_LIMIT: "LOGIN_RATE_LIMIT",
  LOGOUT: "LOGOUT",

  // User management
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",

  // Role & permissions
  ROLE_UPDATE: "ROLE_UPDATE",
  PERMISSION_UPDATE: "PERMISSION_UPDATE",

  // Profile
  PROFILE_UPDATE: "PROFILE_UPDATE",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",

  // Upload
  UPLOAD_RATE_LIMIT: "UPLOAD_RATE_LIMIT",

  // Export
  EXPORT_RATE_LIMIT: "EXPORT_RATE_LIMIT",

  // CRUD
  CRUD_RATE_LIMIT: "CRUD_RATE_LIMIT",

  // Assignment
  ASSIGNMENT_CREATE: "ASSIGNMENT_CREATE",
  ASSIGNMENT_TRANSFER: "ASSIGNMENT_TRANSFER",
} as const

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]
