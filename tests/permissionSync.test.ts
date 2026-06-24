import { describe, it, expect, vi, beforeEach } from "vitest"
import { needsPermissionRefresh, refreshUserPermissions } from "@/lib/security/permissionSync"

// ─── needsPermissionRefresh ────────────────────────────────────────────────────

describe("needsPermissionRefresh", () => {
  it("returns true when lastPermissionSync is undefined", () => {
    expect(needsPermissionRefresh(undefined)).toBe(true)
  })

  it("returns false when lastPermissionSync is recent (< 30 min)", () => {
    const now = Date.now()
    expect(needsPermissionRefresh(now)).toBe(false)
    expect(needsPermissionRefresh(now - 1000)).toBe(false)           // 1s ago
    expect(needsPermissionRefresh(now - 29 * 60 * 1000)).toBe(false) // 29 min ago
  })

  it("returns true when lastPermissionSync is >= 30 minutes ago", () => {
    const now = Date.now()
    expect(needsPermissionRefresh(now - 30 * 60 * 1000)).toBe(true)  // exactly 30 min
    expect(needsPermissionRefresh(now - 60 * 60 * 1000)).toBe(true)  // 1 hour ago
  })
})

// ─── refreshUserPermissions ────────────────────────────────────────────────────

describe("refreshUserPermissions", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
  } as unknown as import("@prisma/client").PrismaClient

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeUser = (overrides: Record<string, unknown> = {}) => ({
    id: "user-1",
    satkerId: "satker-1",
    role: {
      name: "SUPER_ADMIN",
      permissions: [
        { permission: { code: "dashboard.view" } },
        { permission: { code: "pengaturan.view" } },
      ],
    },
    ...overrides,
  })

  it("returns fresh role, permissions, satkerId, and lastPermissionSync when user is found", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(makeUser())

    const before = Date.now()
    const result = await refreshUserPermissions(mockPrisma, "user-1")
    const after = Date.now()

    expect(result).not.toBeNull()
    expect(result!.role).toBe("SUPER_ADMIN")
    expect(result!.permissions).toEqual(["dashboard.view", "pengaturan.view"])
    expect(result!.satkerId).toBe("satker-1")
    expect(result!.lastPermissionSync).toBeGreaterThanOrEqual(before)
    expect(result!.lastPermissionSync).toBeLessThanOrEqual(after)
  })

  it("reflects role change from database", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(
      makeUser({
        role: {
          name: "OPERATOR",
          permissions: [{ permission: { code: "dashboard.view" } }],
        },
      })
    )

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    expect(result!.role).toBe("OPERATOR")
    expect(result!.permissions).toEqual(["dashboard.view"])
  })

  it("reflects permission change from database", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(
      makeUser({
        role: {
          name: "SUPER_ADMIN",
          permissions: [
            { permission: { code: "dashboard.view" } },
            { permission: { code: "pengaturan.view" } },
            { permission: { code: "pengaturan.create" } },
          ],
        },
      })
    )

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    expect(result!.permissions).toEqual([
      "dashboard.view",
      "pengaturan.view",
      "pengaturan.create",
    ])
  })

  it("reflects satkerId change from database", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(
      makeUser({ satkerId: "satker-NEW" })
    )

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    expect(result!.satkerId).toBe("satker-NEW")
  })

  it("clears all auth data when user is deleted (not found)", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null)

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    expect(result!.role).toBe("")
    expect(result!.permissions).toEqual([])
    expect(result!.satkerId).toBeNull()
    expect(result!.lastPermissionSync).toBeDefined()
  })

  it("returns null (fail-open) when database query throws", async () => {
    mockPrisma.user.findUnique = vi.fn().mockRejectedValue(new Error("DB connection lost"))

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).toBeNull()
  })

  it("defaults role to GUEST when user has no role", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(
      makeUser({ role: null })
    )

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    expect(result!.role).toBe("GUEST")
    expect(result!.permissions).toEqual([])
  })

  it("handles satkerId being null", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(
      makeUser({ satkerId: null })
    )

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    expect(result!.satkerId).toBeNull()
  })

  it("updates lastPermissionSync after successful refresh", async () => {
    const syncBefore = Date.now() - 60 * 60 * 1000 // 1 hour ago

    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(makeUser())

    const result = await refreshUserPermissions(mockPrisma, "user-1")

    expect(result).not.toBeNull()
    // lastPermissionSync should be NOW, not the old value
    expect(result!.lastPermissionSync).toBeGreaterThan(syncBefore)
    expect(result!.lastPermissionSync).toBeGreaterThanOrEqual(Date.now() - 1000)
  })
})
