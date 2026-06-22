import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Health check endpoint — digunakan untuk keep-alive ping
// agar serverless function & database tidak cold start
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Ping ringan ke DB untuk hangatkan koneksi
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
