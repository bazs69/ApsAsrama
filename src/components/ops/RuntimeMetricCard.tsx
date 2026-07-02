import { MetricCard } from "@/components/ui/MetricCard"
import type { ComponentProps } from "react"

// Wrapper to fulfill the Enterprise Architecture requirement for Runtime-specific metric cards
export function RuntimeMetricCard(props: ComponentProps<typeof MetricCard>) {
  return <MetricCard {...props} />
}
