import React from "react"
import { Sparkles, CheckCircle2 } from "lucide-react"

export default function EmptyPriorityState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl text-center animate-in fade-in duration-500">
      <div className="relative mb-5" aria-hidden="true">
        <div className="w-16 h-16 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-900/10 rounded-2xl flex items-center justify-center shadow-sm border border-success-200/50 dark:border-success-800/30 rotate-3 transition-transform hover:rotate-6 duration-300">
          <CheckCircle2 className="w-8 h-8 text-success-600 dark:text-success-400" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-warning-400 animate-pulse" />
      </div>
      <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-2 tracking-tight">Semua Beres!</h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
        Alhamdulillah, tidak ada tugas prioritas saat ini. Saat yang tepat untuk meninjau aktivitas atau mengeksplorasi modul lain.
      </p>
    </div>
  )
}
