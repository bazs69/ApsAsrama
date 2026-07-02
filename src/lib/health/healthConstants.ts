/**
 * Health Constants
 *
 * Single source of truth for health check thresholds, names, and messages.
 */

export const HEALTH_CONSTANTS = {
  VERSION: "1.0.0",

  CHECK_NAMES: {
    DATABASE: "database",
    PRISMA: "prisma_connection",
    MEMORY: "memory",
    UPTIME: "uptime",
    NODE_VERSION: "node_version",
    ENVIRONMENT: "environment",
    REQUEST_LAYER: "request_layer",
    MONITORING: "monitoring",
  },

  THRESHOLDS: {
    /** Heap usage above this % of total = DEGRADED */
    MEMORY_WARN_PERCENT: 80,
    /** Heap usage above this % of total = UNHEALTHY */
    MEMORY_CRITICAL_PERCENT: 95,
    /** Database query timeout in ms */
    DB_TIMEOUT_MS: 5_000,
    /** Minimum supported Node major version */
    MIN_NODE_MAJOR: 18,
  },

  REQUIRED_ENV_VARS: [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ] as readonly string[],

  OPTIONAL_ENV_VARS: [
    "NODE_ENV",
    "CSRF_SECRET",
  ] as readonly string[],
} as const
