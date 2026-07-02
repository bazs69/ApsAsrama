import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Tooltip } from "@/components/ui/Tooltip"

interface StatusBadgeProps {
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "HEALTHY" || status === "SUCCESS") {
    return (
      <Tooltip content="System is fully operational">
        <Badge variant="success" size="md" className="gap-1.5 uppercase tracking-wide">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Healthy
        </Badge>
      </Tooltip>
    )
  }
  
  if (status === "DEGRADED" || status === "WARNING") {
    return (
      <Tooltip content="System components are degraded but functional">
        <Badge variant="warning" size="md" className="gap-1.5 uppercase tracking-wide">
          <AlertTriangle className="w-3.5 h-3.5" />
          Degraded
        </Badge>
      </Tooltip>
    )
  }
  
  return (
    <Tooltip content="Critical system failure detected">
      <Badge variant="danger" size="md" className="gap-1.5 uppercase tracking-wide">
        <XCircle className="w-3.5 h-3.5" />
        Unhealthy
      </Badge>
    </Tooltip>
  )
}
