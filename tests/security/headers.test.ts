import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

describe("Security Headers (next.config.ts)", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const loadConfig = async () => {
    // Dynamic import to allow re-evaluating process.env.NODE_ENV
    const nextConfigModule = await import("../../next.config")
    return nextConfigModule.default
  }

  const getHeadersAsMap = async () => {
    const config = await loadConfig()
    const headersConfig = await config.headers!()
    const allHeaders = headersConfig[0].headers
    return allHeaders.reduce((acc: Record<string, string>, h: { key: string; value: string }) => {
      acc[h.key] = h.value
      return acc
    }, {})
  }

  describe("Static Configuration", () => {
    it("has poweredByHeader set to false", async () => {
      const config = await loadConfig()
      expect(config.poweredByHeader).toBe(false)
    })
  })

  describe("Dynamic Headers (Development)", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development")
    })

    it("includes X-Content-Type-Options: nosniff", async () => {
      const headers = await getHeadersAsMap()
      expect(headers["X-Content-Type-Options"]).toBe("nosniff")
    })

    it("includes X-Frame-Options: DENY", async () => {
      const headers = await getHeadersAsMap()
      expect(headers["X-Frame-Options"]).toBe("DENY")
    })

    it("includes Referrer-Policy: strict-origin-when-cross-origin", async () => {
      const headers = await getHeadersAsMap()
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    })

    it("includes Permissions-Policy with at least camera, microphone, geolocation, payment disabled", async () => {
      const headers = await getHeadersAsMap()
      const policy = headers["Permissions-Policy"]
      expect(policy).toBeDefined()
      expect(policy).toContain("camera=()")
      expect(policy).toContain("microphone=()")
      expect(policy).toContain("geolocation=()")
      expect(policy).toContain("payment=()")
    })

    it("includes Content-Security-Policy-Report-Only with all required directives", async () => {
      const headers = await getHeadersAsMap()
      const csp = headers["Content-Security-Policy-Report-Only"]
      expect(csp).toBeDefined()
      
      const directives = [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "form-action 'self'",
        "connect-src 'self'",
        "img-src",
        "style-src",
        "font-src",
        "script-src"
      ]

      directives.forEach(dir => {
        expect(csp).toContain(dir)
      })
    })

    it("does NOT include Strict-Transport-Security in development", async () => {
      const headers = await getHeadersAsMap()
      expect(headers["Strict-Transport-Security"]).toBeUndefined()
    })
    
    it("matches the expected snapshot to prevent accidental regressions", async () => {
      const config = await loadConfig()
      const headersConfig = await config.headers!()
      expect(headersConfig).toMatchSnapshot()
    })
  })

  describe("Dynamic Headers (Production)", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production")
    })

    it("includes Strict-Transport-Security with correct parameters in production", async () => {
      const headers = await getHeadersAsMap()
      const hsts = headers["Strict-Transport-Security"]
      expect(hsts).toBeDefined()
      expect(hsts).toContain("max-age=")
      expect(hsts).toContain("includeSubDomains")
      expect(hsts).toContain("preload")
    })
  })
})
