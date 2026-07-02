/**
 * User, Role & Permission Business Rule Layer
 * 
 * Single Source of Truth (SSOT) for User Administration, Role Management,
 * and Permission Assignment integrity.
 */

import { BusinessError } from "./businessErrors"
import { BusinessNormalizer } from "./businessNormalizer"
import { BusinessValidation } from "./businessValidation"

// Flexible DB Executor type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaExecutor = any

export const UserBusiness = {
  /**
   * Validates user email format and normalizes to lower case.
   */
  validateUserEmail(email?: string | null): string {
    const cleanEmail = BusinessNormalizer.normalizeWhitespace(email)?.toLowerCase()
    if (!cleanEmail) {
      throw BusinessError.validation("Email wajib diisi.")
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      throw BusinessError.validation("Format email tidak valid.")
    }
    return cleanEmail
  },

  /**
   * Validates and normalizes user full name/username.
   */
  validateUsername(name?: string | null): string {
    return BusinessValidation.requireName(name, "Nama Lengkap / Username")
  },

  /**
   * Validates user phone number format.
   */
  validatePhone(phone?: string | null): string {
    const cleanPhone = BusinessNormalizer.normalizeWhitespace(phone)
    if (!cleanPhone) {
      throw BusinessError.validation("Nomor HP tidak valid.")
    }
    return cleanPhone
  },

  /**
   * Validates uniqueness of user identity against DB.
   */
  async validateUserIdentity(
    db: PrismaExecutor,
    email: string,
    excludeUserId?: string
  ): Promise<void> {
    const cleanEmail = this.validateUserEmail(email)
    const existing = await db.user.findUnique({
      where: { email: cleanEmail }
    })
    if (existing && existing.id !== excludeUserId) {
      throw BusinessError.alreadyExists(`Pengguna dengan email ${cleanEmail}`)
    }
  },

  /**
   * Protects against deleting self account.
   */
  validateSelfDelete(targetUserId: string, currentUserId?: string | null): void {
    if (currentUserId && targetUserId === currentUserId) {
      throw BusinessError.validation("Tidak dapat menghapus akun Anda sendiri.")
    }
  },

  /**
   * Validates self update rules.
   */
  validateSelfUpdate(targetUserId: string, currentUserId?: string | null): void {
    if (!currentUserId || targetUserId !== currentUserId) {
      throw BusinessError.validation("Anda hanya dapat memperbarui profil akun Anda sendiri.")
    }
  },

  /**
   * Validates user status / activation string.
   */
  validateUserActivation(status?: string | null): string {
    const clean = (status || "").trim().toUpperCase()
    if (!clean || (clean !== "ACTIVE" && clean !== "INACTIVE")) {
      return "ACTIVE"
    }
    return clean
  },

  /**
   * Protects system roles against direct modification or renaming.
   */
  validateSystemRoleModification(role: { isSystem?: boolean; name: string }): void {
    if (role.isSystem && role.name === "SUPER_ADMIN") {
      throw BusinessError.validation("Role SUPER_ADMIN adalah role sistem mutlak dan tidak dapat diubah secara langsung.")
    }
  },

  /**
   * Protects system roles and assigned roles against deletion.
   */
  validateRoleDeletion(role: { isSystem?: boolean; _count?: { users: number } }): void {
    if (role.isSystem) {
      throw BusinessError.cannotDelete("Role sistem tidak dapat dihapus.")
    }
    if (role._count && role._count.users > 0) {
      throw BusinessError.cannotDelete("Role masih digunakan oleh pengguna aktif di sistem.")
    }
  },

  /**
   * Prevents removing the last administrator.
   */
  validateLastAdministrator(roleName: string, activeAdminsCount: number): void {
    if (roleName === "SUPER_ADMIN" && activeAdminsCount <= 1) {
      throw BusinessError.validation("Tidak dapat menghapus atau mencabut akses Administrator terakhir di sistem.")
    }
  },

  /**
   * Validates role assignment ID.
   */
  validateRoleAssignment(roleId?: string | null): string {
    return BusinessValidation.validateParent(roleId, "Role Pengguna")
  },

  /**
   * Validates and deduplicates permission assignment list.
   */
  validatePermissionAssignment(permissionIds?: string[] | null): string[] {
    if (!permissionIds || !Array.isArray(permissionIds)) return []
    return Array.from(new Set(permissionIds.filter(id => id && id.trim() !== "")))
  }
}
