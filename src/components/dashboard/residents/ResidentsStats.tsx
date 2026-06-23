import { Users, CheckCircle2, UserX } from "lucide-react"

interface ResidentsStatsProps {
  totalResidents: number
  activeResidents: number
  inactiveResidents: number
}

export default function ResidentsStats({
  totalResidents,
  activeResidents,
  inactiveResidents
}: ResidentsStatsProps) {
  const stats = [
    {
      title: "Total Santri",
      value: totalResidents,
      icon: Users,
      borderClass: "border-zinc-200/55 dark:border-zinc-800",
      iconClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400",
      valueClass: "text-zinc-900 dark:text-white"
    },
    {
      title: "Santri Aktif",
      value: activeResidents,
      icon: CheckCircle2,
      borderClass: "border-emerald-500/20",
      iconClass: "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400",
      valueClass: "text-emerald-655 dark:text-emerald-400"
    },
    {
      title: "Alumni / Tidak Aktif",
      value: inactiveResidents,
      icon: UserX,
      borderClass: "border-red-500/20",
      iconClass: "bg-red-500/10 text-red-500 dark:text-red-400",
      valueClass: "text-red-600 dark:text-red-400"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map(({ title, value, icon: Icon, borderClass, iconClass, valueClass }) => (
        <div key={title} className={`glass rounded-2xl p-5 border ${borderClass} flex items-center space-x-4`}>
          <div className={`w-12 h-12 rounded-xl ${iconClass} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">{title}</p>
            <h3 className={`text-2xl font-bold ${valueClass}`}>{value}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
