/**
 * Monitoring Event Types
 * 
 * Strongly typed interfaces for all events tracked by the monitoring system.
 * Keeping this as a pure type file ensures monitoring logic stays UI-agnostic.
 */

import { type MonitoringSeverity, type EventCategory, type LogLevel } from "./constants"

// Base structure shared by all events
export interface BaseEvent {
  eventId: string
  timestamp: number
  version: string
  category: EventCategory
  severity: MonitoringSeverity
}

// User interaction events (button clicks, modal opens, etc.)
export interface UserEvent extends BaseEvent {
  category: "USER"
  action: string
  targetId?: string
  targetType?: string
  metadata?: Record<string, unknown>
}

// Network request events
export interface RequestEvent extends BaseEvent {
  category: "REQUEST"
  requestId: string
  module: string
  action: string
  durationMs?: number
  success: boolean
  retryCount?: number
}

// Mutation (create/update/delete) events
export interface MutationEvent extends BaseEvent {
  category: "MUTATION"
  mutationKey: string
  module: string
  action: "CREATE" | "UPDATE" | "DELETE"
  success: boolean
  durationMs?: number
}

// Error events
export interface ErrorEvent extends BaseEvent {
  category: "ERROR"
  code: string
  message: string
  stack?: string
  requestId?: string
  module?: string
  context?: Record<string, unknown>
}

// Browser navigation events
export interface NavigationEvent extends BaseEvent {
  category: "NAVIGATION"
  fromPath?: string
  toPath: string
  trigger?: "user" | "redirect" | "back" | "forward"
}

// Authentication events
export interface AuthenticationEvent extends BaseEvent {
  category: "AUTH"
  action: "LOGIN" | "LOGOUT" | "SESSION_EXPIRED" | "UNAUTHORIZED"
  userId?: string
  role?: string
  success: boolean
}

// Security violation events (unauthorized, forbidden, permission denied)
export interface SecurityEvent extends BaseEvent {
  category: "SECURITY"
  event: "UNAUTHORIZED" | "FORBIDDEN" | "PERMISSION_DENIED" | "SESSION_EXPIRED" | "RATE_LIMITED"
  userId?: string
  module?: string
  action?: string
  errorCode?: string
  requestId?: string
}

export type MonitoringEvent =
  | UserEvent
  | RequestEvent
  | MutationEvent
  | ErrorEvent
  | NavigationEvent
  | AuthenticationEvent
  | SecurityEvent

export type { MonitoringSeverity, EventCategory, LogLevel }
