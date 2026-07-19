"use client"

import React, { useEffect, useState } from "react"
import { Gift, Cake } from "lucide-react"
import { getDashboardStats } from "@/app/actions/dashboardActions"

interface BirthdayData {
  id: string
  name: string
  nim: string
  room: string
  age: number
}

export default function BirthdayWidget() {
  const [birthdays, setBirthdays] = useState<BirthdayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getDashboardStats()
        if (res.success && res.data) {
          setBirthdays(res.data.birthdays || [])
        }
      } catch (error) {
        console.error("Failed to load birthdays:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="h-48 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 animate-pulse mt-8"></div>
    )
  }

  // If no birthdays today, don't render anything
  if (birthdays.length === 0) {
    return null
  }

  return (
    <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-t-[2rem] p-6 text-white flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Ulang Tahun Hari Ini</h2>
          <p className="text-primary-100 text-sm">Berikan ucapan selamat kepada santri yang berulang tahun hari ini!</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-b-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Nama Santri</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">NIM</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Kamar</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800 text-right">Usia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {birthdays.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Cake className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium">{b.nim}</td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium">{b.room}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 font-bold text-xs">
                      {b.age} Tahun
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
