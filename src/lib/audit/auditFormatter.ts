import type { AuditEvent } from "./auditTypes"

export class AuditFormatter {
  /**
   * Transforms an AuditEvent into a human-readable description.
   * e.g., "USER_CREATED" -> "User Ahmad menambahkan akun Budi"
   */
  static format(event: AuditEvent): string {
    const actor = event.actorId ? `User (${event.actorId})` : "System"
    const entityInfo = event.entityId ? `${event.entity} [${event.entityId}]` : (event.entity || "Data")
    
    // Check if the executor provided a custom description
    if (event.metadata.description) {
      return event.metadata.description
    }

    switch (event.action) {
      case "USER_CREATED": return `${actor} menambahkan akun ${entityInfo}.`
      case "USER_UPDATED": return `${actor} memperbarui data akun ${entityInfo}.`
      case "USER_DELETED": return `${actor} menghapus akun ${entityInfo}.`
      
      case "ROLE_CREATED": return `${actor} membuat peran baru ${entityInfo}.`
      case "ROLE_UPDATED": return `${actor} memperbarui peran ${entityInfo}.`
      case "ROLE_DELETED": return `${actor} menghapus peran ${entityInfo}.`
      
      case "ASSIGNMENT_CREATED": return `${actor} membuat penugasan ${entityInfo}.`
      case "ASSIGNMENT_UPDATED": return `${actor} memperbarui penugasan ${entityInfo}.`
      case "ASSIGNMENT_DELETED": return `${actor} menghapus penugasan ${entityInfo}.`
      case "ASSIGNMENT_TRANSFERRED": return `${actor} memindahkan penugasan ${entityInfo}.`
      
      case "UNAUTHORIZED_ACCESS": return `${actor} mencoba mengakses area tanpa izin.`
      case "SESSION_EXPIRED": return `Sesi ${actor} telah berakhir.`
      case "PERMISSION_DENIED": return `${actor} ditolak izinnya untuk aksi ${event.metadata.errorCode || "ini"}.`
      case "VALIDATION_FAILED": return `Validasi gagal saat ${actor} memproses ${entityInfo}.`

      case "LOGIN_SUCCESS": return `${actor} berhasil masuk.`
      case "LOGIN_FAILED": return `Upaya masuk gagal untuk ${actor}.`
      
      case "MASTER_DATA_CHANGED": return `${actor} mengubah master data ${entityInfo}.`
      
      case "GENERIC_CREATED": return `${actor} menambahkan ${entityInfo}.`
      case "GENERIC_UPDATED": return `${actor} memperbarui ${entityInfo}.`
      case "GENERIC_DELETED": return `${actor} menghapus ${entityInfo}.`

      default:
        // Fallback for actions directly mapped from secureAction (e.g. "createWilayah")
        if (event.action.startsWith("create")) return `${actor} membuat ${entityInfo}.`
        if (event.action.startsWith("update")) return `${actor} memperbarui ${entityInfo}.`
        if (event.action.startsWith("delete")) return `${actor} menghapus ${entityInfo}.`
        return `${actor} melakukan aksi ${event.action} pada ${entityInfo}.`
    }
  }
}
