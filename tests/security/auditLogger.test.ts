import { describe, it, expect, beforeEach, vi } from "vitest"
import { logAuditEvent, AuditEventInput } from "@/lib/security/auditLogger"
import { AuditAction } from "@/lib/security/auditActions"
import prisma from "@/lib/prisma"

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    securityEvent: {
      create: vi.fn(),
    },
  },
}))

describe("Audit Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Successful Logging", () => {
    it("preserves all basic fields and calls create exactly once", async () => {
      vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as never)

      const input: AuditEventInput = {
        action: AuditAction.LOGIN_SUCCESS,
        resource: "auth",
        actorId: "user-123",
        resourceId: "session-456",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        metadata: { browser: "Chrome" },
      }

      await logAuditEvent(input)

      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(1)
      expect(prisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          action: "LOGIN_SUCCESS",
          resource: "auth",
          actorId: "user-123",
          resourceId: "session-456",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
          metadata: { browser: "Chrome" },
        },
      })
    })

    it("handles undefined optional fields by mapping them to null or undefined correctly", async () => {
      vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as never)

      const input: AuditEventInput = {
        action: AuditAction.LOGOUT,
        resource: "auth",
      }

      await logAuditEvent(input)

      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(1)
      expect(prisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          action: "LOGOUT",
          resource: "auth",
          actorId: null,
          resourceId: null,
          ipAddress: null,
          userAgent: null,
          metadata: undefined,
        },
      })
    })

    it("handles explicit null metadata by coercing it to undefined for Prisma Json", async () => {
      vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as never)

      const input: AuditEventInput = {
        action: AuditAction.USER_UPDATE,
        resource: "user",
        metadata: null,
      }

      await logAuditEvent(input)

      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: undefined }),
        })
      )
    })

    it("handles different AuditAction values", async () => {
      vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as never)

      await logAuditEvent({ action: AuditAction.ROLE_UPDATE, resource: "role" })
      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: "ROLE_UPDATE" }) })
      )

      await logAuditEvent({ action: AuditAction.CRUD_RATE_LIMIT, resource: "crud" })
      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: "CRUD_RATE_LIMIT" }) })
      )
    })

    it("handles complex and nested metadata objects", async () => {
      vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as never)

      const complexMetadata = {
        changes: [
          { field: "name", old: "John", new: "Johnny" },
          { field: "status", old: "ACTIVE", new: "INACTIVE" },
        ],
        reason: "Admin request",
        nested: { a: 1, b: { c: true } },
      }

      await logAuditEvent({
        action: AuditAction.USER_UPDATE,
        resource: "user",
        metadata: complexMetadata,
      })

      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: complexMetadata }),
        })
      )
    })

    it("does not mutate the input object", async () => {
      vi.mocked(prisma.securityEvent.create).mockResolvedValue({} as never)

      const originalMetadata = { test: true }
      const input: AuditEventInput = {
        action: AuditAction.LOGIN_FAILURE,
        resource: "auth",
        actorId: "user-1",
        metadata: originalMetadata,
      }
      
      const clone = { ...input, metadata: { ...originalMetadata } }

      await logAuditEvent(input)

      expect(input).toEqual(clone)
    })
  })

  describe("Fail-open Behavior", () => {
    it("swallows errors when Prisma throws and resolves successfully without throwing", async () => {
      vi.mocked(prisma.securityEvent.create).mockRejectedValue(new Error("DB Connection Error"))

      await expect(
        logAuditEvent({ action: AuditAction.LOGIN_SUCCESS, resource: "auth" })
      ).resolves.toBeUndefined()
    })

    it("handles repeated failures without ever throwing", async () => {
      vi.mocked(prisma.securityEvent.create).mockRejectedValue(new Error("DB Timeout"))

      // Call multiple times
      await expect(logAuditEvent({ action: AuditAction.LOGIN_SUCCESS, resource: "auth" })).resolves.toBeUndefined()
      await expect(logAuditEvent({ action: AuditAction.LOGOUT, resource: "auth" })).resolves.toBeUndefined()
      await expect(logAuditEvent({ action: AuditAction.USER_CREATE, resource: "user" })).resolves.toBeUndefined()

      expect(prisma.securityEvent.create).toHaveBeenCalledTimes(3)
    })
  })
})
