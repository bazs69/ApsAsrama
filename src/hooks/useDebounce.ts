"use client"

import { useState, useEffect } from "react"

/**
 * useDebounce
 *
 * Delays updating the returned value until after `delay` ms have passed
 * since the last time the input `value` changed.
 *
 * Generic — works with any value type (string, number, object, etc.).
 * Typically used to debounce a search input before making a network request.
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 400)
 * useEffect(() => { fetchData(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
