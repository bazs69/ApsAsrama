"use client"

import React, { useEffect, useState } from "react"
import { DashboardProps } from "../types"
import WelcomeHeader from "../components/WelcomeHeader"
import { getSatkerDashboardData } from "@/app/actions/satkerDashboardActions"
import { Users, ClipboardCheck, Activity as ActivityIcon, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

type SatkerData = {
  santri: any[]
  stats: { total: number; active: number; completedTasks: number }
  recentTasks: any[]
}

export default function SatkerDashboard({ user }: DashboardProps) {
  const [data, setData] = useState<SatkerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (user.satkerId) {
        setLoading(true)
        const result = await getSatkerDashboardData(user.satkerId)
        setData(result)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.satkerId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Memuat data Dashboard Satuan Kerja...</p>
      </div>
    )
  }

  if (!user.satkerId) {
    return (
      <div className="space-y-8">
        <WelcomeHeader user={user} />
        <div className="glass p-8 rounded-2xl border border-rose-500/20 text-center">
          <h3 className="text-rose-600 dark:text-rose-400 font-semibold mb-2">Akun Belum Terkait Satuan Kerja</h3>
          <p className="text-zinc-500 dark:text-zinc-400">Anda masuk sebagai Kepala Satker, namun akun Anda belum dikaitkan dengan Satker manapun. Hubungi Administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <WelcomeHeader user={user} />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Santri Aktif</p>
            <h3 className="text-2xl font-bold font-heading text-zinc-800 dark:text-zinc-100">{data?.stats.active || 0}</h3>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Evaluasi Selesai (Total)</p>
            <h3 className="text-2xl font-bold font-heading text-zinc-800 dark:text-zinc-100">{data?.stats.completedTasks || 0}</h3>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 bg-violet-500/10 text-violet-600 rounded-xl flex items-center justify-center">
            <ActivityIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Jadwal Terdekat</p>
            <h3 className="text-lg font-bold font-heading text-zinc-800 dark:text-zinc-100 mt-1">Monitoring</h3>
          </div>
        </div>
      </div>

      {/* Main Content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Table Santri Satker */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">Data Santri Satuan Kerja</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Daftar santri yang ditugaskan pada satker ini (informasi terbatas)</p>
              </div>
              <Link href="/dashboard/assignments" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center space-x-1">
                <span>Kelola Penugasan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium">
                  <tr>
                    <th className="px-5 py-4">Nama Santri</th>
                    <th className="px-5 py-4">NIM/NIUP</th>
                    <th className="px-5 py-4">Posisi</th>
                    <th className="px-5 py-4">Kamar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {data?.santri && data.santri.length > 0 ? (
                    data.santri.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-200">{s.name}</td>
                        <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">{s.nim}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-500/10 text-primary-700 dark:text-primary-400">
                            {s.position}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">{s.room}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-zinc-500 dark:text-zinc-400">
                        Belum ada santri yang ditugaskan di satker ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100 mb-4">Aktivitas Monitor Terbaru</h3>
            {data?.recentTasks && data.recentTasks.length > 0 ? (
              <div className="space-y-4">
                {data.recentTasks.map((task) => (
                  <div key={task.id} className="flex items-start space-x-3 pb-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Evaluasi: {task.residentName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Status: {task.status} • Predikat: {task.predicate || "-"}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-300 mt-1">{new Date(task.tanggal).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Belum ada aktivitas monitoring tercatat.
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link href="/dashboard/monitoring-penugasan" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center justify-center space-x-1">
                <span>Lihat Semua Monitoring</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
