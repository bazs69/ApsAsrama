import AkademikClient from "@/components/dashboard/AkademikClient"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AkademikPage() {
  const hierarchy = await prisma.fakultas.findMany({
    include: {
      prodis: {
        include: {
          angkatans: true
        },
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  })

  return (
    <AkademikClient initialHierarchy={hierarchy} />
  )
}
