import { ShieldCheck, AlertTriangle, Info } from "lucide-react"

interface SecurityRecommendationProps {
  recommendations: string[]
}

export function SecurityRecommendation({ recommendations }: SecurityRecommendationProps) {
  const isHealthy =
    recommendations.length === 1 &&
    recommendations[0].includes("Tidak ada ancaman")

  return (
    <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-xl ${
            isHealthy
              ? "bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400"
              : "bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400"
          }`}
        >
          {isHealthy ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Security Recommendations</h3>
      </div>

      <ul className="space-y-3" role="list" aria-label="Security recommendations">
        {recommendations.map((rec, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 p-3 rounded-xl ${
              isHealthy
                ? "bg-success-50 dark:bg-success-900/10"
                : "bg-warning-50 dark:bg-warning-900/10"
            }`}
          >
            <Info
              className={`w-4 h-4 flex-none mt-0.5 ${
                isHealthy
                  ? "text-success-600 dark:text-success-400"
                  : "text-warning-600 dark:text-warning-400"
              }`}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
