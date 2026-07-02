"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface PaginationMetadata {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  search?: string
  sort?: string
  order?: string
}

interface UsePaginationOptions {
  /** The URL pathname to update. */
  basePath: string
  /** The initial metadata coming from the server. */
  initialMeta: PaginationMetadata
}

/**
 * usePagination
 *
 * A generic, URL-synced pagination hook.
 * Does NOT know about any specific data entity.
 * Reads ?page, ?pageSize, ?search, ?sort, ?order from the URL
 * and writes back to them on changes (scroll: false).
 */
export function usePagination({ basePath, initialMeta }: UsePaginationOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Derive pagination state from URL params, fallback to server-provided values.
  const currentPage = Number(searchParams.get("page") ?? initialMeta.currentPage)
  const pageSize = Number(searchParams.get("pageSize") ?? initialMeta.pageSize)
  const search = searchParams.get("search") ?? (initialMeta.search ?? "")
  const sort = searchParams.get("sort") ?? (initialMeta.sort ?? "createdAt")
  const order = searchParams.get("order") ?? (initialMeta.order ?? "asc")

  /**
   * Internal helper that merges pagination params into the URL without
   * dropping other existing params (e.g. search, sort).
   */
  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v === "" || v === undefined) {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      })
      router.replace(`${basePath}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, basePath],
  )

  const goToPage = useCallback(
    (page: number) => updateUrl({ page: String(page) }),
    [updateUrl],
  )

  const nextPage = useCallback(() => {
    if (currentPage < initialMeta.totalPages) goToPage(currentPage + 1)
  }, [currentPage, initialMeta.totalPages, goToPage])

  const prevPage = useCallback(() => {
    if (currentPage > 1) goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const changePageSize = useCallback(
    (size: number) => updateUrl({ page: "1", pageSize: String(size) }),
    [updateUrl],
  )

  const setSearch = useCallback(
    (q: string) => updateUrl({ page: "1", search: q }),
    [updateUrl],
  )

  const setSort = useCallback(
    (field: string, dir: "asc" | "desc") =>
      updateUrl({ page: "1", sort: field, order: dir }),
    [updateUrl],
  )

  return {
    currentPage,
    pageSize,
    search,
    sort,
    order,
    totalItems: initialMeta.totalItems,
    totalPages: initialMeta.totalPages,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    setSearch,
    setSort,
  }
}
