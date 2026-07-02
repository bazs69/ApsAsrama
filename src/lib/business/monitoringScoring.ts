import { MonitoringPredicate } from "@prisma/client"

export type MonitoringScores = {
  attendanceScore: number
  disciplineScore: number
  responsibilityScore: number
  workQualityScore: number
  attitudeScore: number
  teamworkScore: number
}

// Weights can be adjusted here in the future
export const SCORE_WEIGHTS = {
  attendanceScore: 1,
  disciplineScore: 1,
  responsibilityScore: 1,
  workQualityScore: 1,
  attitudeScore: 1,
  teamworkScore: 1,
}

export const CRITERIA_COUNT = Object.keys(SCORE_WEIGHTS).length

export function calculateTotalScore(scores: MonitoringScores): number {
  return (
    scores.attendanceScore * SCORE_WEIGHTS.attendanceScore +
    scores.disciplineScore * SCORE_WEIGHTS.disciplineScore +
    scores.responsibilityScore * SCORE_WEIGHTS.responsibilityScore +
    scores.workQualityScore * SCORE_WEIGHTS.workQualityScore +
    scores.attitudeScore * SCORE_WEIGHTS.attitudeScore +
    scores.teamworkScore * SCORE_WEIGHTS.teamworkScore
  )
}

export function calculateAverageScore(scores: MonitoringScores): number {
  const total = calculateTotalScore(scores)
  const totalWeight = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
  return total / totalWeight
}

export function calculatePredicate(averageScore: number): MonitoringPredicate {
  if (averageScore >= 4.5) return "SANGAT_BAIK"
  if (averageScore >= 3.5) return "BAIK"
  if (averageScore >= 2.5) return "CUKUP"
  if (averageScore >= 1.5) return "KURANG"
  return "SANGAT_KURANG"
}

export function getPredicateLabel(predicate: MonitoringPredicate | null | string): string {
  switch (predicate) {
    case "SANGAT_BAIK": return "Sangat Baik"
    case "BAIK": return "Baik"
    case "CUKUP": return "Cukup"
    case "KURANG": return "Kurang"
    case "SANGAT_KURANG": return "Sangat Kurang"
    default: return "-"
  }
}

// Backward compatibility helper
export function mapOldStatusToPredicate(status: string): MonitoringPredicate | null {
  if (status === "Sangat Aktif" || status === "Sangat Baik") return "SANGAT_BAIK"
  if (status === "Aktif" || status === "Baik") return "BAIK"
  if (status === "Cukup Aktif" || status === "Cukup") return "CUKUP"
  if (status === "Kurang Aktif" || status === "Kurang") return "KURANG"
  if (status === "Tidak Aktif" || status === "Sangat Kurang") return "SANGAT_KURANG"
  return null
}
