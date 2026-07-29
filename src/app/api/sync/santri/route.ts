import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const residents = await prisma.resident.findMany({
      include: {
        room: {
          include: {
            daerah: true,
          }
        },
        asalCountry: true,
        asalProvince: true,
        asalRegency: true,
        asalDistrict: true,
        asalVillage: true,
        fakultasRef: true,
        prodiRef: true,
      }
    });

    return NextResponse.json({
      status: 200,
      message: "Berhasil mengambil data santri",
      data: residents
    });
  } catch (error) {
    console.error("Error fetching residents for sync:", error);
    return NextResponse.json(
      { status: 500, message: "Terjadi kesalahan internal", error: String(error) },
      { status: 500 }
    );
  }
}
