import React from "react"
import { getPengurusAsrama } from "@/app/actions/pengurusActions"
import PengurusClient from "./PengurusClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Data Pengurus Asrama | SPThree Connect",
  description: "Manajemen data pengurus asrama",
}

export default async function PengurusPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  // Fetch existing pengurus
  const res = await getPengurusAsrama()
  const initialData = res.success && res.data ? res.data : []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Data Pengurus Asrama
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola daftar santri yang menjabat sebagai pengurus asrama.
          </p>
        </div>
      </div>

      <PengurusClient initialData={initialData} />
    </div>
  )
}
