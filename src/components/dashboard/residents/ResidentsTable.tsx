import { DoorOpen, User, MapPin, Map } from "lucide-react"
import { CldImage } from "next-cloudinary"
import { Resident } from "./types"

interface ResidentsTableProps {
  filteredResidents: Resident[]
  isSelectionActive: boolean
  selectedIds: Set<string>
  handleSelectAll: (filteredRes: Resident[]) => void
  handleSelectToggle: (id: string) => void
  setViewingResident: (resident: Resident) => void
  viewMode?: "list" | "grid"
}

export default function ResidentsTable({
  filteredResidents,
  isSelectionActive,
  selectedIds,
  handleSelectAll,
  handleSelectToggle,
  setViewingResident,
  viewMode = "list"
}: ResidentsTableProps) {
  if (filteredResidents.length === 0) {
    return (
      <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
        Tidak ada data santri yang cocok dengan pencarian Anda.
      </div>
    )
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredResidents.map((res) => (
          <div
            key={res.id}
            onClick={() => setViewingResident(res)}
            className={`cursor-pointer glass rounded-2xl border ${isSelectionActive && selectedIds.has(res.id)
              ? "border-primary-500 bg-primary-500/5 dark:bg-primary-900/20"
              : "border-zinc-200 dark:border-zinc-800 hover:border-success-300 dark:hover:border-success-700/50"
              } p-5 overflow-hidden transition-all duration-300 relative group`}
          >
            {isSelectionActive && (
              <div
                className="absolute top-4 right-4 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectToggle(res.id)
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(res.id)}
                  onChange={() => { }}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-primary-600 cursor-pointer"
                />
              </div>
            )}

            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm mb-3">
                {res.photo ? (
                  <CldImage src={res.photo} alt={res.name} width={64} height={64} crop="fill" gravity="face" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-zinc-400" />
                )}
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-center line-clamp-1">{res.name}</h3>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-450 mt-1">{res.nim || "-"}</p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center text-sm">
                <DoorOpen className="w-4 h-4 mr-2 text-primary-500/70" />
                {res.room ? (
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Kamar {res.room.number}</span>
                ) : (
                  <span className="text-amber-600 text-xs font-semibold bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded-md">-</span>
                )}
              </div>

              <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                <MapPin className="w-4 h-4 mr-2 text-zinc-400" />
                <span className="line-clamp-1">{res.daerah || "-"}</span>
              </div>

              <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                <Map className="w-4 h-4 mr-2 text-zinc-400" />
                <span className="line-clamp-1">{res.wilayah || "-"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">
              {isSelectionActive && (
                <th className="py-3 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={filteredResidents.length > 0 && filteredResidents.every(r => selectedIds.has(r.id))}
                    onChange={() => handleSelectAll(filteredResidents)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-primary-600 cursor-pointer"
                    title="Pilih Semua"
                  />
                </th>
              )}
              <th className="py-3 px-4">No</th>
              <th className="py-3 px-4">NIM</th>
              <th className="py-3 px-4">Nama</th>
              <th className="py-3 px-4">Kamar</th>
              <th className="py-3 px-4">Daerah</th>
              <th className="py-3 px-4">Wilayah</th>
              <th className="py-3 px-4">Kota Asal</th>
            </tr>
          </thead>
          <tbody className="text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-300">
            {filteredResidents.map((res, index) => (
              <tr
                key={res.id}
                onClick={() => setViewingResident(res)}
                className={`transition-all cursor-pointer border-b border-zinc-200 dark:border-zinc-700 last:border-0 ${isSelectionActive && selectedIds.has(res.id)
                  ? "bg-primary-500/5 dark:bg-primary-500/10 border-l-2 border-l-primary-500"
                  : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-l-2 border-l-transparent"
                  }`}
              >
                {isSelectionActive && (
                  <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(res.id)}
                      onChange={() => handleSelectToggle(res.id)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-primary-600 cursor-pointer"
                    />
                  </td>
                )}
                <td className="py-2.5 px-4 text-zinc-500 dark:text-zinc-400 text-xs">{index + 1}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">{res.nim || "-"}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                      {res.photo ? (
                        <CldImage src={res.photo} alt={res.name} width={32} height={32} crop="fill" gravity="face" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">{res.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  {res.room ? (
                    <span className="flex items-center space-x-1.5 text-primary-600 dark:text-primary-400 font-bold">
                      <DoorOpen className="w-4 h-4 text-primary-500/70" />
                      <span>{res.room.number}</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/100/10 border border-amber-500/20 rounded-lg px-2 py-1 text-xs font-semibold">-</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300 text-sm">{res.daerah || <span className="text-zinc-400 dark:text-zinc-650">-</span>}</td>
                <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300 text-sm">{res.wilayah || <span className="text-zinc-400 dark:text-zinc-650">-</span>}</td>
                <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300 text-sm">{res.kotaAsal || <span className="text-zinc-400 dark:text-zinc-650">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
