/**
 * Enterprise Prisma Error Mapper Layer
 * 
 * Translates low-level Prisma database exceptions into clean, standardized
 * BusinessError instances.
 */

import { Prisma } from "@prisma/client"
import { BusinessError } from "@/lib/business/businessErrors"

export function mapPrismaError(error: unknown, entityName: string = "Data"): BusinessError {
  if (error instanceof BusinessError) {
    return error
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return BusinessError.alreadyExists(entityName)
      case "P2003":
        return BusinessError.cannotDelete(entityName)
      case "P2025":
        return BusinessError.conflict(entityName)
      default:
        return new BusinessError(`Database error [${error.code}]: Terjadi kesalahan saat memproses data ${entityName}.`, "DB_ERROR")
    }
  }

  if (error instanceof Error) {
    return new BusinessError(error.message, "UNEXPECTED_ERROR")
  }

  return new BusinessError(`Terjadi kesalahan yang tidak diketahui pada ${entityName}.`, "UNKNOWN_ERROR")
}

/**
 * Helper to wrap a Prisma execution block and automatically map any thrown errors
 * into BusinessErrors.
 */
export async function executePrismaOperation<T>(operation: () => Promise<T>, entityName: string = "Data"): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw mapPrismaError(error, entityName)
  }
}
