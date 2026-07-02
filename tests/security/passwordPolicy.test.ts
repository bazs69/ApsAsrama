import { describe, it, expect } from "vitest"
import { validatePassword, getPasswordRequirements } from "@/lib/security/passwordPolicy"

describe("Password Policy", () => {
  describe("validatePassword()", () => {
    it("validates a password satisfying every rule passes", () => {
      const result = validatePassword("Str0ng!Pass")
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("fails for an empty string", () => {
      const result = validatePassword("")
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(5) // Fails all 5 rules
    })

    it("fails when below minimum length", () => {
      const result = validatePassword("A1!a") // length 4, has all char types
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Minimal 8 karakter")])
      )
    })

    it("fails for missing uppercase letter", () => {
      const result = validatePassword("str0ng!pass")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("huruf besar (A-Z)")])
      )
    })

    it("fails for missing lowercase letter", () => {
      const result = validatePassword("STR0NG!PASS")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("huruf kecil (a-z)")])
      )
    })

    it("fails for missing number", () => {
      const result = validatePassword("Strong!Pass")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("angka (0-9)")])
      )
    })

    it("fails for missing special character", () => {
      const result = validatePassword("Str0ngPassw0rd")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining("karakter khusus")])
      )
    })

    it("fails correctly for uppercase + lowercase only", () => {
      const result = validatePassword("StrongPassword")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(2)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("angka (0-9)"),
          expect.stringContaining("karakter khusus")
        ])
      )
    })

    it("fails correctly for uppercase + number only", () => {
      const result = validatePassword("STRONG123456")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(2)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("huruf kecil (a-z)"),
          expect.stringContaining("karakter khusus")
        ])
      )
    })

    it("fails correctly for lowercase + number only", () => {
      const result = validatePassword("strong123456")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(2)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("huruf besar (A-Z)"),
          expect.stringContaining("karakter khusus")
        ])
      )
    })

    it("fails correctly for special character only", () => {
      const result = validatePassword("!@#$%^&*()")
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(3)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("huruf besar (A-Z)"),
          expect.stringContaining("huruf kecil (a-z)"),
          expect.stringContaining("angka (0-9)")
        ])
      )
    })

    it("validates long password (>64 chars)", () => {
      const longPass = "A1!" + "b".repeat(70)
      const result = validatePassword(longPass)
      expect(result.valid).toBe(true)
    })

    it("validates unicode characters correctly without breaking", () => {
      const result = validatePassword("Str0ng!Pass😊")
      expect(result.valid).toBe(true)
    })

    it("does not mutate the input string", () => {
      const originalPassword = "Str0ng!Password"
      const password = originalPassword
      const result = validatePassword(password)
      expect(result.valid).toBe(true)
      expect(password).toBe(originalPassword)
    })

    it("throws TypeError when passed undefined as the current implementation does not guard against it", () => {
      // @ts-expect-error Intentionally passing undefined to test runtime behaviour
      expect(() => validatePassword(undefined)).toThrow(TypeError)
    })
  })

  describe("getPasswordRequirements()", () => {
    it("returns an array", () => {
      const reqs = getPasswordRequirements()
      expect(Array.isArray(reqs)).toBe(true)
    })

    it("contains every expected requirement", () => {
      const reqs = getPasswordRequirements()
      const keys = reqs.map(r => r.key)
      expect(keys).toEqual(["minLength", "uppercase", "lowercase", "number", "special"])
    })

    it("requirement order remains stable", () => {
      const reqs1 = getPasswordRequirements()
      const reqs2 = getPasswordRequirements()
      expect(reqs1).toEqual(reqs2)
    })

    it("every requirement has expected fields", () => {
      const reqs = getPasswordRequirements()
      reqs.forEach(req => {
        expect(req).toHaveProperty("key")
        expect(typeof req.key).toBe("string")
        
        expect(req).toHaveProperty("label")
        expect(typeof req.label).toBe("string")
        
        expect(req).toHaveProperty("test")
        expect(typeof req.test).toBe("function")
      })
    })

    it("does not mutate shared state between calls", () => {
      const reqs1 = getPasswordRequirements()
      const reqs2 = getPasswordRequirements()
      
      expect(reqs1.length).toBe(5)
      expect(reqs2.length).toBe(5)
      expect(reqs1).toBe(reqs2) // Should return the exact same frozen/constant array reference
    })
  })
})
