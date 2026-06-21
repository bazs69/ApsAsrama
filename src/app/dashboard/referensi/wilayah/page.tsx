import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import WilayahClient from "@/components/dashboard/referensi/wilayah/WilayahClient"
import {
  getCountries,
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages
} from "@/app/actions/wilayah"
import prisma from "@/lib/prisma"
import { ComponentProps } from "react"

export default async function WilayahPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session) redirect("/login")
  
  const permissions = session.user.permissions || []
  if (!permissions.includes("wilayah.view")) redirect("/dashboard/forbidden")

  const resolvedSearchParams = await searchParams
  const activeTab = (resolvedSearchParams.tab as string) || "negara"
  const search = (resolvedSearchParams.search as string) || ""
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page as string) : 1
  const parentId = (resolvedSearchParams.parentId as string) || ""

  let data: Record<string, unknown>[] = []
  let total = 0
  let totalPages = 0
  
  // Dashboard Metrics
  const [countCountries, countProvinces, countRegencies, countDistricts, countVillages] = await Promise.all([
    prisma.country.count(),
    prisma.province.count(),
    prisma.regency.count(),
    prisma.district.count(),
    prisma.village.count()
  ])

  // Dropdowns
  const countriesDropdown = await prisma.country.findMany({ orderBy: { name: 'asc' } })
  const provincesDropdown = await prisma.province.findMany({ orderBy: { name: 'asc' } })
  const regenciesDropdown = await prisma.regency.findMany({ orderBy: { name: 'asc' } })
  const districtsDropdown = await prisma.district.findMany({ orderBy: { name: 'asc' } })

  if (activeTab === "negara") {
    const res = await getCountries(search, page)
    data = res.data
    total = res.total
    totalPages = res.totalPages
  } else if (activeTab === "provinsi") {
    const res = await getProvinces(search, page, parentId)
    data = res.data
    total = res.total
    totalPages = res.totalPages
  } else if (activeTab === "kabupaten") {
    const res = await getRegencies(search, page, parentId)
    data = res.data
    total = res.total
    totalPages = res.totalPages
  } else if (activeTab === "kecamatan") {
    const res = await getDistricts(search, page, parentId)
    data = res.data
    total = res.total
    totalPages = res.totalPages
  } else if (activeTab === "desa") {
    const res = await getVillages(search, page, parentId)
    data = res.data
    total = res.total
    totalPages = res.totalPages
  }

  return (
    <WilayahClient
      activeTab={activeTab}
      search={search}
      page={page}
      parentId={parentId}
      data={data as unknown as ComponentProps<typeof WilayahClient>["data"]}
      total={total}
      totalPages={totalPages}
      permissions={permissions}
      metrics={{
        country: countCountries,
        province: countProvinces,
        regency: countRegencies,
        district: countDistricts,
        village: countVillages
      }}
      dropdowns={{
        countries: countriesDropdown,
        provinces: provincesDropdown,
        regencies: regenciesDropdown,
        districts: districtsDropdown
      }}
    />
  )
}
