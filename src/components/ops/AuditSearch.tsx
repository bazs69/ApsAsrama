"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { Input } from "@/components/ui/Input"

export function AuditSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [term, setTerm] = useState(searchParams.get("q") || "")
  const debouncedTerm = useDebounce(term, 400)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedTerm) {
      params.set("q", debouncedTerm)
    } else {
      params.delete("q")
    }
    params.delete("page") // Reset to page 1 on search
    
    // Only push if changed
    if (searchParams.get("q") !== debouncedTerm && (debouncedTerm !== "" || searchParams.has("q"))) {
      router.push(`${pathname}?${params.toString()}`)
    }
  }, [debouncedTerm, router, pathname, searchParams])

  return (
    <div className="relative flex-1 w-full min-w-[200px] max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
        <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
      </div>
      <Input
        type="text"
        className="pl-10"
        placeholder="Cari Action, Module, User..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Cari Log Audit"
      />
    </div>
  )
}
