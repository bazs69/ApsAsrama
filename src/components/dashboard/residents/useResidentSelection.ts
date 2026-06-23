import { useState } from "react"
import type { Resident } from "./types"

export function useResidentSelection() {
  const [selectedResidents, setSelectedResidents] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const selectedCount = selectedResidents.size

  const toggleSelection = (id: string) => {
    setSelectedResidents(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = (filteredResidents: Resident[]) => {
    const allFilteredIds = filteredResidents.map(r => r.id)
    const allSelected = allFilteredIds.every(id => selectedResidents.has(id))

    setSelectedResidents(prev => {
      const next = new Set(prev)
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id))
      } else {
        allFilteredIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedResidents(new Set())
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      clearSelection()
    }
  }

  return {
    selectedResidents,
    isSelectionMode,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectedCount,
    toggleSelectionMode
  }
}
