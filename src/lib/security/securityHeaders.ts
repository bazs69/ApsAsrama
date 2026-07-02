/**
 * Security Headers Helper
 *
 * Generates standardised, production-ready HTTP security headers.
 * This module is a pure helper — it does not modify any middleware.
 * Import and spread into your Next.js config or middleware response headers.
 */

import { SECURITY_CONFIG } from "./securityConfig"

export interface SecurityHeadersMap {
  [key: string]: string
}

/**
 * Builds the complete set of recommended security headers.
 * All values are derived from SECURITY_CONFIG — no magic strings.
 */
export function buildSecurityHeaders(options?: {
  nonce?: string
  disableHSTS?: boolean
}): SecurityHeadersMap {
  const { hsts, frameOptions, contentTypeOptions, referrerPolicy } = SECURITY_CONFIG.headers

  const cspDirectives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline'${options?.nonce ? ` 'nonce-${options.nonce}'` : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]

  const headers: SecurityHeadersMap = {
    "Content-Security-Policy": cspDirectives.join("; "),
    "X-Frame-Options": frameOptions,
    "X-Content-Type-Options": contentTypeOptions,
    "Referrer-Policy": referrerPolicy,
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
    ].join(", "),
    "X-DNS-Prefetch-Control": "on",
    "X-XSS-Protection": "1; mode=block",
  }

  if (!options?.disableHSTS) {
    let hstsValue = `max-age=${hsts.maxAge}`
    if (hsts.includeSubDomains) hstsValue += "; includeSubDomains"
    if (hsts.preload) hstsValue += "; preload"
    headers["Strict-Transport-Security"] = hstsValue
  }

  return headers
}

/**
 * Returns an array of { key, value } pairs compatible with Next.js
 * `next.config.js` headers() configuration.
 */
export function buildNextJsHeaders(options?: Parameters<typeof buildSecurityHeaders>[0]) {
  return Object.entries(buildSecurityHeaders(options)).map(([key, value]) => ({ key, value }))
}
