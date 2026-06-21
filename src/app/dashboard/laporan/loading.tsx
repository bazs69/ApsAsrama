export default function LoadingLaporan() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-2"></div>
          <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-40 bg-zinc-200 dark:bg-zinc-700/50 rounded-xl"></div>
        ))}
      </div>

      {/* Filter Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-2"></div>
              <div className="h-11 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
            <div>
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-2"></div>
              <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm h-80">
            <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-6"></div>
            <div className="h-56 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
