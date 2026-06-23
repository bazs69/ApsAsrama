import { useState } from "react"
import type { Resident } from "./types"

interface UseResidentFilterParams {
  residents: Resident[]
  search: string
}

export function useResidentFilter({ residents, search }: UseResidentFilterParams) {
  const [showFilter, setShowFilter] = useState(false)
  const [filterWilayah, setFilterWilayah] = useState("")
  const [filterProdi, setFilterProdi] = useState("")
  const [filterAngkatan, setFilterAngkatan] = useState("")
  const [filterKamar, setFilterKamar] = useState("")

  const resetFilters = () => {
    setFilterWilayah("")
    setFilterProdi("")
    setFilterAngkatan("")
    setFilterKamar("")
  }

  const toggleFilter = () => {
    setShowFilter(!showFilter)
    if (showFilter) {
      resetFilters()
    }
  }

  const uniqueWilayah = Array.from(new Set(residents.map(r => r.wilayah).filter(Boolean))).sort() as string[]
  const uniqueProdi = Array.from(new Set(residents.map(r => r.prodi).filter(Boolean))).sort() as string[]
  const uniqueAngkatan = Array.from(new Set(residents.map(r => r.angkatan).filter(Boolean))).sort() as string[]
  const uniqueKamar = Array.from(new Set(residents.map(r => r.room?.number).filter(Boolean))).sort((a, b) => {
    const numA = parseInt(a as string, 10)
    const numB = parseInt(b as string, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return (a as string).localeCompare(b as string)
  }) as string[]

  const filteredResidents = residents.filter(res => {
    const matchSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      (res.nim && res.nim.includes(search)) ||
      (res.niup && res.niup.includes(search))

    const matchWilayah = filterWilayah ? res.wilayah === filterWilayah : true
    const matchProdi = filterProdi ? res.prodi === filterProdi : true
    const matchAngkatan = filterAngkatan ? res.angkatan === filterAngkatan : true
    const matchKamar = filterKamar ? res.room?.number === filterKamar : true

    return matchSearch && matchWilayah && matchProdi && matchAngkatan && matchKamar
  })

  return {
    showFilter,
    filterWilayah,
    filterProdi,
    filterAngkatan,
    filterKamar,
    setFilterWilayah,
    setFilterProdi,
    setFilterAngkatan,
    setFilterKamar,
    toggleFilter,
    resetFilters,
    uniqueWilayah,
    uniqueProdi,
    uniqueAngkatan,
    uniqueKamar,
    filteredResidents
  }
}
