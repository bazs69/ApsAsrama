/**
 * Request Client
 * 
 * The main Enterprise generic request executor.
 * Wraps any promise (Server Action, Fetch, etc.) with timeout, retry, logging, and error normalization.
 */

import { type RequestConfig, type RequestMetadata, type ApiResponse, type RequestContext } from "./requestTypes"
import { REQUEST_CONSTANTS } from "./requestConstants"
import { generateRequestId } from "./requestId"
import { requestLogger } from "./requestLogger"
import { withTimeout } from "./requestTimeout"
import { normalizeError } from "./errorNormalizer"
import { monitor } from "@/lib/monitoring/monitor"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"

export async function executeRequest<T>(
  executor: (context: RequestContext) => Promise<T>,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const startedAt = Date.now()
  const metadata: RequestMetadata = {
    requestId: generateRequestId(),
    startedAt,
    module: config.module,
    action: config.action,
    version: REQUEST_CONSTANTS.API_VERSION,
  }

  const timeoutMs = config.timeout || REQUEST_CONSTANTS.DEFAULT_TIMEOUT
  const maxRetries = config.retry ?? (config.isIdempotent ? REQUEST_CONSTANTS.DEFAULT_RETRY : 0)
  
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      if (attempt === 0) requestLogger.logStart(metadata)
      else requestLogger.logStart(metadata, `Retry attempt ${attempt}/${maxRetries}`)

      // Execute the request with timeout protection
      const result = await withTimeout((abortController) => {
        return executor({ metadata, abortController })
      }, timeoutMs)

      metadata.duration = Date.now() - startedAt
      requestLogger.logSuccess(metadata)

      // Track successful request in monitoring layer
      monitor.trackRequest({
        category: MONITORING_CONSTANTS.CATEGORY.REQUEST,
        severity: MONITORING_CONSTANTS.SEVERITY.INFO,
        requestId: metadata.requestId,
        module: metadata.module ?? "Unknown",
        action: metadata.action ?? "unknown",
        durationMs: metadata.duration,
        success: true,
        retryCount: attempt,
      })

      return {
        success: true,
        data: result,
        metadata,
      }

    } catch (error) {
      metadata.duration = Date.now() - startedAt
      const normalizedError = normalizeError(error, metadata)
      
      // Determine if we should retry
      const isLastAttempt = attempt >= maxRetries
      const shouldRetry = normalizedError.error.retryable && !isLastAttempt && config.isIdempotent !== false

      if (shouldRetry) {
        requestLogger.logError(metadata, error, `Failed attempt ${attempt}. Retrying...`)
        attempt++
        
        // Simple exponential backoff: 500ms, 1000ms, 2000ms, etc.
        const backoffMs = Math.min(500 * Math.pow(2, attempt - 1), 5000)
        await new Promise(res => setTimeout(res, backoffMs))
        continue
      }

      requestLogger.logError(metadata, error, isLastAttempt && attempt > 0 ? `Final attempt failed` : undefined)

      // Track failure in monitoring layer
      monitor.trackError({
        category: MONITORING_CONSTANTS.CATEGORY.ERROR,
        severity: normalizedError.error.severity,
        code: normalizedError.error.code,
        message: normalizedError.error.description,
        requestId: metadata.requestId,
        module: metadata.module,
        context: { action: metadata.action, retryCount: attempt },
      })

      return normalizedError
    }
  }

  // Fallback (should theoretically never be reached due to loop structure)
  return normalizeError(new Error("Maximum retries exceeded"), metadata)
}
