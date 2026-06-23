import { useState } from "react"
import type { Resident } from "./types"

interface UseResidentPaginationParams {
  residents: Resident[]
  initialPageSize?: number
}

export function useResidentPagination({
  residents,
  initialPageSize = 10
}: UseResidentPaginationParams) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, updatePageSize] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(residents.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedResidents = residents.slice(startIndex, startIndex + pageSize)

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  const nextPage = () => {
    goToPage(currentPage + 1)
  }

  const prevPage = () => {
    goToPage(currentPage - 1)
  }

  const setPageSize = (size: number) => {
    updatePageSize(size)
    setCurrentPage(1)
  }

  return {
    currentPage: safeCurrentPage,
    pageSize,
    totalPages,
    paginatedResidents,
    nextPage,
    prevPage,
    goToPage,
    setPageSize
  }
}
