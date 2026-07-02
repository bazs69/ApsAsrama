/**
 * Import Dispatcher
 * 
 * Abstraction layer for bulk imports.
 * 
 * Implementasi saat ini menggunakan pemanggilan sinkron (synchronous) ke fungsi
 * bulkCreateResidents. Di Production V2, ini siap diganti dengan integrasi ke BullMQ / Redis
 * atau message broker lainnya tanpa harus melakukan perubahan pada Business Layer.
 */
import { bulkCreateResidents } from "@/app/actions/residents"
import { logOperationalError } from "@/lib/business/businessLogger"

type BulkResidentsData = Parameters<typeof bulkCreateResidents>[0]

export async function dispatchBulkImport(data: BulkResidentsData): Promise<{
  success: boolean
  message: string
  created?: number
}> {
  try {
    // Di Production V2:
    // 1. Upload data ke Storage (S3 / lokal) atau teruskan array.
    // 2. Buat job di Queue: await bullmq.add("bulk-import", { data, uploaderId })
    // 3. Return respons instan: { success: true, message: "Import dimasukkan ke antrean." }

    // Implementasi saat ini (sinkron untuk kompatibilitas):
    const result = await bulkCreateResidents(data)
    
    if (result.error) {
      return { success: false, message: result.error }
    }
    
    return { 
      success: true, 
      message: "Import berhasil", 
      created: result.successCount 
    }
  } catch (error) {
    logOperationalError({
      action: "dispatchBulkImport",
      error: error instanceof Error ? error.message : String(error)
    })
    return { success: false, message: "Gagal memproses import. Silakan coba lagi." }
  }
}
