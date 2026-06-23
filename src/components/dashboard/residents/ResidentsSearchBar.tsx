import { Search, Filter } from "lucide-react"

interface ResidentsSearchBarProps {
  search: string
  onSearchChange: (value: string) => void
  showFilter: boolean
  onToggleFilter: () => void
  filteredCount: number
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export default function ResidentsSearchBar({
  search,
  onSearchChange,
  showFilter,
  onToggleFilter,
  filteredCount,
  hasActiveFilters,
  onResetFilters
}: ResidentsSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
      <div className="flex-1 w-full flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Cari nama santri atau NIM..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-800 dark:text-white placeholder-zinc-450 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
        <button
          onClick={onToggleFilter}
          className={`p-2 rounded-lg transition-all flex items-center space-x-2 text-sm font-medium ${showFilter ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      <div className="flex items-center space-x-3 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">
          Total data: <span className="font-bold text-zinc-900 dark:text-white">{filteredCount}</span>
        </span>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
