import { AlertTriangle, ShieldAlert } from "lucide-react"
import type { ThreatLevel } from "@/lib/security/threatDetector"
import { Badge } from "@/components/ui/Badge"
import { Tooltip } from "@/components/ui/Tooltip"

interface ThreatBadgeProps {
  level: ThreatLevel
}

export function ThreatBadge({ level }: ThreatBadgeProps) {
  const Icon = level === "CRITICAL" || level === "HIGH" ? ShieldAlert : AlertTriangle

  const getVariant = (level: ThreatLevel) => {
    switch (level) {
      case "LOW": return "success"
      case "MEDIUM": return "warning"
      case "HIGH": return "danger"
      case "CRITICAL": return "danger"
      default: return "default"
    }
  }

  const extraClass = level === "CRITICAL" 
    ? "bg-danger-100 dark:bg-danger-900/40 border-danger-300 dark:border-danger-700 text-danger-800 dark:text-danger-300"
    : ""

  const tooltipContents = {
    LOW: "Low threat level: No active anomalies detected",
    MEDIUM: "Medium threat level: Elevated rate limit or brute force events observed",
    HIGH: "High threat level: Multiple critical security anomalies detected",
    CRITICAL: "Critical threat level: Immediate defense measures active",
  }

  return (
    <Tooltip content={tooltipContents[level] || `Threat level: ${level}`}>
      <Badge 
        variant={getVariant(level)} 
        size="md" 
        className={`gap-1.5 uppercase tracking-widest ${extraClass}`}
        aria-live="polite"
        aria-label={`Threat level: ${level}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {level}
      </Badge>
    </Tooltip>
  )
}
