/**
 * Request Types
 * 
 * Defines all TypeScript interfaces for the Enterprise Request Layer.
 * Keeps the request layer strongly typed and consistent.
 */

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestMetadata {
  requestId: string
  startedAt: number
  duration?: number
  module?: string
  action?: string
  version: string
}

export interface RequestContext {
  metadata: RequestMetadata
  abortController: AbortController
}

export interface RequestConfig {
  timeout?: number
  retry?: number
  module?: string
  action?: string
  isIdempotent?: boolean // If true, safe to retry (e.g. GET). If false, do not retry (e.g. POST, DELETE)
}

export interface ApiSuccess<T> {
  success: true
  data: T
  metadata: RequestMetadata
}

export interface ApiFailure {
  success: false
  error: {
    code: string
    title: string
    description: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    retryable: boolean
  }
  metadata: RequestMetadata
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
