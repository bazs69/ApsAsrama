/**
 * Runtime Constants
 *
 * Labels and keys for runtime metrics.
 */

export const RUNTIME_CONSTANTS = {
  METRIC_NAMES: {
    PROCESS_UPTIME: "process_uptime",
    HEAP_USED: "heap_used_mb",
    HEAP_TOTAL: "heap_total_mb",
    RSS: "rss_mb",
    EXTERNAL: "external_mb",
    CPU_USER: "cpu_user_us",
    CPU_SYSTEM: "cpu_system_us",
  },
} as const
