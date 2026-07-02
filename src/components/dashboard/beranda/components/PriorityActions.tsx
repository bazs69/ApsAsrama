import React from "react"
import { PriorityAction } from "../types"
import PriorityCard from "./PriorityCard"
import EmptyPriorityState from "./EmptyPriorityState"

interface PriorityActionsProps {
  actions: PriorityAction[]
}

export default function PriorityActions({ actions }: PriorityActionsProps) {
  if (!actions || actions.length === 0) {
    return <EmptyPriorityState />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Daftar Aksi Prioritas">
      {actions.map((action) => (
        <div role="listitem" key={action.id}>
          <PriorityCard action={action} />
        </div>
      ))}
    </div>
  )
}
