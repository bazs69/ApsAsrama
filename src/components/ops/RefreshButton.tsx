"use client"

import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function RefreshButton() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <Button
      onClick={handleRefresh}
      loading={isRefreshing}
      variant="outline"
      size="sm"
      iconLeft={!isRefreshing ? <RefreshCw className="w-4 h-4" /> : undefined}
      aria-label="Refresh data"
    >
      Refresh
    </Button>
  )
}
