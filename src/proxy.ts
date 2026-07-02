import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { PERMISSIONS } from "@/lib/security/permissions"

// Mapping of route prefixes to required permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/dashboard/residents": PERMISSIONS.SANTRI_VIEW,
  "/dashboard/muallim": PERMISSIONS.MUALLIM_VIEW,
  "/dashboard/assignments": PERMISSIONS.PENUGASAN_VIEW,
  "/dashboard/monitoring-penugasan": PERMISSIONS.MONITORING_VIEW,
  "/dashboard/absensi/muallim": PERMISSIONS.ABSENSI_VIEW,
  "/dashboard/absensi/kegiatan": PERMISSIONS.ABSENSI_VIEW,
  "/dashboard/absensi/apel": PERMISSIONS.ABSENSI_VIEW,
  "/dashboard/area": PERMISSIONS.AREA_VIEW,
  "/dashboard/akademik": PERMISSIONS.AKADEMIK_VIEW,
  "/dashboard/kbm": PERMISSIONS.KBM_VIEW,
  "/dashboard/role-user": PERMISSIONS.ROLE_VIEW,
  "/dashboard/assignments/satkers": PERMISSIONS.SATKER_VIEW,
  "/dashboard/settings": PERMISSIONS.PENGATURAN_VIEW,
  "/dashboard/laporan": PERMISSIONS.LAPORAN_VIEW,
  "/dashboard/formulir": PERMISSIONS.FORMULIR_VIEW,
  "/dashboard/referensi/wilayah": PERMISSIONS.WILAYAH_VIEW,
}

// Renamed from "middleware" to "proxy" (Next.js 16 convention)
export const proxy = withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (!token) return NextResponse.redirect(new URL("/login", req.url))

    const userPermissions = (token.permissions as string[]) || []

    // Check if the current pathname requires a specific permission
    for (const [route, reqPerm] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        if (!userPermissions.includes(reqPerm)) {
          return NextResponse.rewrite(new URL("/dashboard/forbidden", req.url))
        }
      }
    }

    // Dashboard base route needs dashboard.view
    if (pathname === "/dashboard" && !userPermissions.includes(PERMISSIONS.DASHBOARD_VIEW)) {
      return NextResponse.rewrite(new URL("/dashboard/forbidden", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ["/dashboard/:path*"]
}
