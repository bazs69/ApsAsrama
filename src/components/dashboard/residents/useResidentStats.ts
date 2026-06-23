import { ResidentStatus } from "./types"
import type { Resident } from "./types"

export function useResidentStats(residents: Resident[]) {
  const totalResidents = residents.length
  const activeResidents = residents.filter(r => r.status === ResidentStatus.ACTIVE).length
  const inactiveResidents = residents.filter(r => r.status === ResidentStatus.INACTIVE).length

  return {
    totalResidents,
    activeResidents,
    inactiveResidents
  }
}
