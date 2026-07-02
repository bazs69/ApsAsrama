import { useState, useEffect, useCallback } from "react"
import { SystemStatusData, ServiceStatus } from "../types"
import { mockSystemStatus } from "../data/announcementMockData"

interface UseSystemStatusReturn {
  status: SystemStatusData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// TODO: Replace with actual health endpoint when backend is ready
// e.g. fetch('/api/health') and map response to SystemStatusData
export function useSystemStatus(): UseSystemStatusReturn {
  const [status, setStatus] = useState<SystemStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // setState calls happen inside setTimeout callback, not directly in the effect body
    const timer = setTimeout(() => {
      try {
        setStatus(mockSystemStatus)
        setError(null)
      } catch {
        setError("Gagal memuat status sistem.")
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [tick])

  const refetch = useCallback(() => {
    setIsLoading(true)
    setTick(t => t + 1)
  }, [])

  return { status, isLoading, error, refetch }
}

export function getStatusLabel(s: ServiceStatus): string {
  const labels: Record<ServiceStatus, string> = {
    online: "Online",
    offline: "Offline",
    maintenance: "Maintenance",
    checking: "Checking..."
  }
  return labels[s] ?? s
}

export function getStatusStyle(s: ServiceStatus): { dot: string; text: string } {
  const styles: Record<ServiceStatus, { dot: string; text: string }> = {
    online: { dot: "bg-success-500", text: "text-success-600 dark:text-success-400" },
    offline: { dot: "bg-danger-500", text: "text-danger-600 dark:text-danger-400" },
    maintenance: { dot: "bg-warning-500", text: "text-warning-600 dark:text-warning-400" },
    checking: { dot: "bg-info-500 animate-pulse", text: "text-info-600 dark:text-info-400" }
  }
  return styles[s] ?? styles.checking
}
