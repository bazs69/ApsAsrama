"use client"

import { useOptimistic } from "react"

export type OptimisticAction<T> =
  | { type: "create"; payload: T }
  | { type: "update"; payload: T }
  | { type: "delete"; id: string }

export type OptimisticItem<T> = T & { _isOptimistic?: boolean }

/**
 * useOptimisticList
 *
 * A generic hook to apply optimistic UI updates for lists.
 * - Create: Adds item instantly to the list with `_isOptimistic: true`.
 * - Update: Replaces item instantly in the list with `_isOptimistic: true`.
 * - Delete: Removes item instantly from the list.
 *
 * It uses React's native `useOptimistic` under the hood.
 *
 * @param initialList The ground-truth list from the server (or standard React state)
 */
export function useOptimisticList<T extends { id: string }>(initialList: T[]) {
  const [optimisticList, addOptimisticAction] = useOptimistic(
    initialList,
    (state: T[], action: OptimisticAction<T>) => {
      switch (action.type) {
        case "create":
          return [...state, { ...action.payload, _isOptimistic: true }]
        case "update":
          return state.map((item) =>
            item.id === action.payload.id ? { ...action.payload, _isOptimistic: true } : item
          )
        case "delete":
          return state.filter((item) => item.id !== action.id)
        default:
          return state
      }
    }
  )

  return { optimisticList: optimisticList as OptimisticItem<T>[], addOptimisticAction }
}
