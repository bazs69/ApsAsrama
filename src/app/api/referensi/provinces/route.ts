import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const countryId = searchParams.get("countryId")
  const limit = 100 

  const skip = (page - 1) * limit
  const where: Prisma.ProvinceWhereInput = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }
    : {}

  if (countryId) where.countryId = countryId

  try {
    const data = await prisma.province.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
