interface ResidentsFilterProps {
  filterWilayah: string
  filterProdi: string
  filterAngkatan: string
  filterKamar: string
  uniqueWilayah: string[]
  uniqueProdi: string[]
  uniqueAngkatan: string[]
  uniqueKamar: string[]
  setFilterWilayah: (value: string) => void
  setFilterProdi: (value: string) => void
  setFilterAngkatan: (value: string) => void
  setFilterKamar: (value: string) => void
}

export default function ResidentsFilter({
  filterWilayah,
  filterProdi,
  filterAngkatan,
  filterKamar,
  uniqueWilayah,
  uniqueProdi,
  uniqueAngkatan,
  uniqueKamar,
  setFilterWilayah,
  setFilterProdi,
  setFilterAngkatan,
  setFilterKamar
}: ResidentsFilterProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          value={filterWilayah}
          onChange={(e) => setFilterWilayah(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
        >
          <option value="">Semua Wilayah</option>
          {uniqueWilayah.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterProdi}
          onChange={(e) => setFilterProdi(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
        >
          <option value="">Semua Prodi</option>
          {uniqueProdi.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterAngkatan}
          onChange={(e) => setFilterAngkatan(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
        >
          <option value="">Semua Angkatan</option>
          {uniqueAngkatan.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterKamar}
          onChange={(e) => setFilterKamar(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
        >
          <option value="">Semua Kamar</option>
          {uniqueKamar.map(k => <option key={k} value={k}>Kamar {k}</option>)}
        </select>
      </div>
    </div>
  )
}
