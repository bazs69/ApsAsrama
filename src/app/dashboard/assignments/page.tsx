import { getAssignments, getSatkers } from "@/app/actions/assignments"
import { getResidents } from "@/app/actions/residents"
import AssignmentListClient from "@/components/dashboard/AssignmentListClient"
import { ResidentStatus } from "@prisma/client"
import { ComponentProps } from "react"

export const revalidate = 30

export default async function AssignmentsPage() {
  const [assignments, satkers, residents] = await Promise.all([
    getAssignments(),
    getSatkers(),
    getResidents()
  ])

  // Format dates for safe serialization between Server and Client Components
  const serializedAssignments = (assignments as { startDate: Date, endDate: Date | null, [key: string]: unknown }[]).map((a) => ({
    ...a,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate ? a.endDate.toISOString() : null,
  })) as unknown as ComponentProps<typeof AssignmentListClient>["initialAssignments"]

  // Filter only active residents for assigning new tasks
  const activeResidents = residents.filter(
    (r) => r.status === ResidentStatus.ACTIVE
  ) as unknown as ComponentProps<typeof AssignmentListClient>["residents"]

  return (
    <AssignmentListClient
      initialAssignments={serializedAssignments}
      initialSatkers={satkers as unknown as ComponentProps<typeof AssignmentListClient>["initialSatkers"]}
      residents={activeResidents}
    />
  )
}
