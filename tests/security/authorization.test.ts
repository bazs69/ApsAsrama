import { describe, it, expect, beforeEach, vi } from "vitest"
import { getServerSession } from "next-auth"
import {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
} from "@/lib/security/authorization"

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

// Mock @/lib/auth to avoid importing real prisma/crypto dependencies
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

describe("Authorization Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Factory to easily mock session
  const mockSession = (user: { role?: string; permissions?: string[] } | null = {}) => {
    if (!user) {
      vi.mocked(getServerSession).mockResolvedValue(null)
      return
    }
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "test-user",
        name: "Test",
        email: "test@example.com",
        ...user,
      },
      expires: "9999-12-31T23:59:59.999Z",
    })
  }

  const expectForbidden = async (fn: () => Promise<void>) => {
    await expect(fn()).rejects.toThrowError(/^Forbidden$/)
  }

  describe("requirePermission()", () => {
    it("throws Error('Forbidden') when session is missing", async () => {
      mockSession(null)
      await expectForbidden(() => requirePermission("dashboard.view"))
    })

    it("throws Error('Forbidden') when user lacks the permission", async () => {
      mockSession({ permissions: ["other.view"] })
      await expectForbidden(() => requirePermission("dashboard.view"))
    })
    
    it("throws Error('Forbidden') when permissions array is undefined", async () => {
      mockSession({ permissions: undefined })
      await expectForbidden(() => requirePermission("dashboard.view"))
    })

    it("succeeds when permission exists", async () => {
      mockSession({ permissions: ["dashboard.view"] })
      await expect(requirePermission("dashboard.view")).resolves.toBeUndefined()
    })

    it("does not mutate inputs", async () => {
      mockSession({ permissions: ["dashboard.view"] })
      const perm = "dashboard.view"
      await requirePermission(perm)
      expect(perm).toBe("dashboard.view")
    })
  })

  describe("requireAnyPermission()", () => {
    it("throws when session is missing", async () => {
      mockSession(null)
      await expectForbidden(() => requireAnyPermission(["dashboard.view"]))
    })

    it("throws when user has none of the permissions", async () => {
      mockSession({ permissions: ["other.view"] })
      await expectForbidden(() => requireAnyPermission(["dashboard.view", "settings.view"]))
    })

    it("throws when permissions array is undefined", async () => {
      mockSession({ permissions: undefined })
      await expectForbidden(() => requireAnyPermission(["dashboard.view"]))
    })
    
    it("handles an empty required permission array", async () => {
      mockSession({ permissions: ["dashboard.view"] })
      await expectForbidden(() => requireAnyPermission([]))
    })

    it("succeeds when user has exactly one required permission", async () => {
      mockSession({ permissions: ["dashboard.view"] })
      await expect(requireAnyPermission(["dashboard.view", "settings.view"])).resolves.toBeUndefined()
    })

    it("succeeds when user has multiple required permissions", async () => {
      mockSession({ permissions: ["dashboard.view", "settings.view"] })
      await expect(requireAnyPermission(["dashboard.view", "settings.view"])).resolves.toBeUndefined()
    })

    it("does not mutate inputs", async () => {
      mockSession({ permissions: ["dashboard.view"] })
      const required = ["dashboard.view", "settings.view"]
      const clone = [...required]
      await requireAnyPermission(required)
      expect(required).toEqual(clone)
    })
  })

  describe("requireAllPermissions()", () => {
    it("throws when session is missing", async () => {
      mockSession(null)
      await expectForbidden(() => requireAllPermissions(["dashboard.view"]))
    })

    it("throws when one required permission is missing", async () => {
      mockSession({ permissions: ["dashboard.view"] }) // Missing settings.view
      await expectForbidden(() => requireAllPermissions(["dashboard.view", "settings.view"]))
    })

    it("throws when multiple permissions are missing", async () => {
      mockSession({ permissions: ["other.view"] })
      await expectForbidden(() => requireAllPermissions(["dashboard.view", "settings.view"]))
    })
    
    it("throws when user permissions array is undefined", async () => {
      mockSession({ permissions: undefined })
      await expectForbidden(() => requireAllPermissions(["dashboard.view"]))
    })

    it("succeeds only when every required permission exists", async () => {
      mockSession({ permissions: ["dashboard.view", "settings.view", "extra.view"] })
      await expect(requireAllPermissions(["dashboard.view", "settings.view"])).resolves.toBeUndefined()
    })

    it("does not mutate inputs", async () => {
      mockSession({ permissions: ["dashboard.view", "settings.view"] })
      const required = ["dashboard.view", "settings.view"]
      const clone = [...required]
      await requireAllPermissions(required)
      expect(required).toEqual(clone)
    })
  })

  describe("requireRole()", () => {
    it("throws when session is missing", async () => {
      mockSession(null)
      await expectForbidden(() => requireRole("ADMIN"))
    })

    it("throws when role does not match", async () => {
      mockSession({ role: "USER" })
      await expectForbidden(() => requireRole("ADMIN"))
    })
    
    it("throws when user role is undefined", async () => {
      mockSession({ role: undefined })
      await expectForbidden(() => requireRole("ADMIN"))
    })

    it("succeeds when role matches exactly", async () => {
      mockSession({ role: "ADMIN" })
      await expect(requireRole("ADMIN")).resolves.toBeUndefined()
    })

    it("does not mutate inputs", async () => {
      mockSession({ role: "ADMIN" })
      const role = "ADMIN"
      await requireRole(role)
      expect(role).toBe("ADMIN")
    })
  })
})
