"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type ReactNode } from "react"

export default function QueryProvider({ children }: { children: ReactNode }) {
  // We use useState to ensure the QueryClient is only instantiated once per session.
  // This prevents losing the cache on component re-renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Enterprise configuration reasons:
            // 5 minutes staleTime: prevents redundant refetching during quick navigation,
            // assuming data like users/roles doesn't change every second.
            staleTime: 5 * 60 * 1000, 
            
            // 10 minutes gcTime: keeps inactive data in memory slightly longer than staleTime
            // so if a user hits "Back" to a previous page, the UI is instant while it refetches.
            gcTime: 10 * 60 * 1000,
            
            // retry 2 times: smooths over transient network blips without annoying the user too much.
            retry: 2, 
            
            // refetchOnWindowFocus: false: prevents massive query storms when users switch tabs back and forth.
            // Explicit user actions (mutations) or pagination will trigger necessary invalidations anyway.
            refetchOnWindowFocus: false,
            
            // refetchOnReconnect: true: crucial for mobile and intermittent connections. 
            // Ensures data is fresh once connection is restored.
            refetchOnReconnect: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools will only be included in development bundles by default */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
