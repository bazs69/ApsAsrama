"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

const THROTTLE_MS = 1000 // 1 second
const DEFAULT_TIMEOUT_MINUTES = 10
const CHECK_INTERVAL_MS = 30 * 1000 // 30 seconds

export default function IdleTimeoutProvider({ children }: { children: React.ReactNode }) {
  const lastWriteRef = useRef<number>(0)

  useEffect(() => {
    // Initialize or refresh last_activity when component mounts (authenticated)
    localStorage.setItem("last_activity", Date.now().toString())
    lastWriteRef.current = Date.now()

    const handleActivity = () => {
      const now = Date.now()
      // Throttle writes to localStorage to prevent performance hit
      if (now - lastWriteRef.current > THROTTLE_MS) {
        localStorage.setItem("last_activity", now.toString())
        lastWriteRef.current = now
      }
    }

    const checkIdle = () => {
      const lastActivityStr = localStorage.getItem("last_activity")
      if (!lastActivityStr) return

      const lastActivity = parseInt(lastActivityStr, 10)
      const now = Date.now()
      
      const envTimeout = process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES
      const timeoutMinutes = envTimeout ? parseInt(envTimeout, 10) : DEFAULT_TIMEOUT_MINUTES
      const finalTimeoutMinutes = isNaN(timeoutMinutes) ? DEFAULT_TIMEOUT_MINUTES : timeoutMinutes
      const timeoutMs = finalTimeoutMinutes * 60 * 1000

      if (now - lastActivity > timeoutMs) {
        // Idle timeout reached across all tabs
        localStorage.removeItem("last_activity")
        
        // Silent logout via NextAuth
        signOut({ callbackUrl: "/login?error=SessionExpired" })
      }
    }

    // Attach passive listeners
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"]
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Setup polling interval for idle check
    const intervalId = setInterval(checkIdle, CHECK_INTERVAL_MS)

    // Cleanup on unmount
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(intervalId)
    }
  }, [])

  return <>{children}</>
}
