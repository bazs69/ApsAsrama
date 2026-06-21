import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Mapping of route prefixes to required permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/dashboard/residents": "santri.view",
  "/dashboard/muallim": "muallim.view",
  "/dashboard/assignments": "penugasan.view",
  "/dashboard/monitoring-penugasan": "monitoring.view",
  "/dashboard/absensi/muallim": "absensi.view",
  "/dashboard/absensi/kegiatan": "absensi.view",
  "/dashboard/absensi/apel": "absensi.view",
  "/dashboard/area": "area.view",
  "/dashboard/akademik": "akademik.view",
  "/dashboard/kbm": "kbm.view",
  "/dashboard/role-user": "role.view",
  "/dashboard/assignments/satkers": "satker.view",
  "/dashboard/settings": "pengaturan.view",
  "/dashboard/laporan": "laporan.view",
  "/dashboard/formulir": "formulir.view",
  "/dashboard/referensi/wilayah": "wilayah.view",
}

export default withAuth(
  function middleware(req) {
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
    if (pathname === "/dashboard" && !userPermissions.includes("dashboard.view")) {
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
