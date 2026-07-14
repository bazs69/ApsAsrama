import { getResidentsBySatker } from "@/app/actions/residents"
import { getAreaHierarchy } from "@/app/actions/area"
import { getFakultas, getProdi, getAngkatan } from "@/app/actions/masterData"
import ResidentsClient from "@/components/dashboard/ResidentsClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SatkerSantriPage() {
    const session = await getServerSession(authOptions)
    const satkerId = session?.user?.satkerId

    if (!satkerId) {
        redirect("/dashboard")
    }

    // Jalankan semua query secara paralel
    const [
        residents,
        areaHierarchy,
        fakultasOptions,
        prodiOptions,
        angkatanOptions
    ] = await Promise.all([
        getResidentsBySatker(satkerId),
        getAreaHierarchy(),
        getFakultas(),
        getProdi(),
        getAngkatan()
    ])

    const permissions = session?.user?.permissions || []

    return (
        <ResidentsClient
            initialResidents={residents}
            areaHierarchy={areaHierarchy}
            fakultasOptions={fakultasOptions}
            prodiOptions={prodiOptions}
            angkatanOptions={angkatanOptions}
            permissions={permissions}
            isSatkerView={true}
        />
    )
}
