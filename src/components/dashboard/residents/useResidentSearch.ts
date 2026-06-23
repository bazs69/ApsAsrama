import { useState } from "react"

export function useResidentSearch() {
  const [search, setSearch] = useState("")

  return {
    search,
    setSearch
  }
}
