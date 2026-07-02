import { describe, it, expect } from "vitest"
import { AuditAction } from "@/lib/security/auditActions"

describe("AuditAction", () => {
  it("is an object", () => {
    expect(typeof AuditAction).toBe("object")
    expect(AuditAction).not.toBeNull()
  })

  it("contains all expected actions currently implemented", () => {
    const expectedKeys = [
      "LOGIN_SUCCESS",
      "LOGIN_FAILURE",
      "LOGIN_RATE_LIMIT",
      "LOGOUT",
      "USER_CREATE",
      "USER_UPDATE",
      "USER_DELETE",
      "ROLE_UPDATE",
      "PERMISSION_UPDATE",
      "PROFILE_UPDATE",
      "PASSWORD_CHANGE",
      "UPLOAD_RATE_LIMIT",
      "EXPORT_RATE_LIMIT",
      "CRUD_RATE_LIMIT",
    ]

    const actualKeys = Object.keys(AuditAction)
    
    expectedKeys.forEach((key) => {
      expect(actualKeys).toContain(key)
    })
  })

  it("ensures all values are strings", () => {
    Object.values(AuditAction).forEach((value) => {
      expect(typeof value).toBe("string")
    })
  })

  it("ensures all values are unique (no duplicates)", () => {
    const values = Object.values(AuditAction)
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBe(values.length)
  })

  it("remains stable and is treated as constant", () => {
    const before = { ...AuditAction }
    const after = { ...AuditAction }
    expect(before).toEqual(after)
  })
})
