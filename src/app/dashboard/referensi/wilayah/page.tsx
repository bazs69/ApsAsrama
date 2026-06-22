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

  const metricsPromise = Promise.all([
    prisma.country.count(),
    prisma.province.count(),
    prisma.regency.count(),
    prisma.district.count(),
    prisma.village.count()
  ])

  const emptyDropdown = Promise.resolve([])
  const countriesPromise = activeTab === "provinsi"
    ? prisma.country.findMany({ orderBy: { name: 'asc' }, select: { id: true, code: true, name: true } })
    : emptyDropdown
  const provincesPromise = activeTab === "kabupaten"
    ? prisma.province.findMany({ orderBy: { name: 'asc' }, select: { id: true, code: true, name: true } })
    : emptyDropdown
  const regenciesPromise = activeTab === "kecamatan"
    ? prisma.regency.findMany({ orderBy: { name: 'asc' }, select: { id: true, code: true, name: true } })
    : emptyDropdown
  const districtsPromise = activeTab === "desa"
    ? prisma.district.findMany({ orderBy: { name: 'asc' }, select: { id: true, code: true, name: true } })
    : emptyDropdown

  let dataPromise
  if (activeTab === "negara") {
    dataPromise = getCountries(search, page)
  } else if (activeTab === "provinsi") {
    dataPromise = getProvinces(search, page, parentId)
  } else if (activeTab === "kabupaten") {
    dataPromise = getRegencies(search, page, parentId)
  } else if (activeTab === "kecamatan") {
    dataPromise = getDistricts(search, page, parentId)
  } else if (activeTab === "desa") {
    dataPromise = getVillages(search, page, parentId)
  } else {
    dataPromise = Promise.resolve({ data: [], total: 0, totalPages: 0 })
  }

  const [
    [countCountries, countProvinces, countRegencies, countDistricts, countVillages],
    countriesDropdown,
    provincesDropdown,
    regenciesDropdown,
    districtsDropdown,
    { data, total, totalPages }
  ] = await Promise.all([
    metricsPromise,
    countriesPromise,
    provincesPromise,
    regenciesPromise,
    districtsPromise,
    dataPromise
  ])

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
