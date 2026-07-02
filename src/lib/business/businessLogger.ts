import { monitorAdapter } from "@/lib/monitoring/monitorAdapter"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"

export interface OperationalErrorInput {
  action: string
  entity?: string
  error: unknown
}

export function logOperationalError(input: OperationalErrorInput) {
  const message = input.error instanceof Error ? input.error.message : String(input.error)
  const fullMessage = `[${input.action}${input.entity ? `|${input.entity}` : ""}] ${message}`
  
  monitorAdapter.trackError({
    category: MONITORING_CONSTANTS.CATEGORY.ERROR,
    severity: MONITORING_CONSTANTS.SEVERITY.ERROR,
    code: "OP_ERR",
    message: fullMessage,
  })
}
