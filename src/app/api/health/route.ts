import { NextResponse } from "next/server"
import { getSystemHealth } from "@/lib/health/systemHealth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const health = await getSystemHealth()

    const isHealthy = health.database === true && health.cache === true

    return NextResponse.json(
      { 
        status: isHealthy ? "ok" : "degraded", 
        database: health.database ? "connected" : "disconnected",
        cache: health.cache ? "connected" : "disconnected",
        queue: health.queue ? "connected" : "disconnected",
        timestamp: new Date().toISOString() 
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
