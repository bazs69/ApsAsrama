"use server"

import prisma from "@/lib/prisma"
import { logOperationalError } from "@/lib/business/businessLogger"

export async function getSatkerDashboardData(satkerId?: string | null) {
    if (!satkerId) {
        return {
            santri: [],
            stats: { total: 0, active: 0, completedTasks: 0 },
            recentTasks: []
        }
    }

    try {
        const assignments = await prisma.assignment.findMany({
            where: { satkerId, status: "ACTIVE" },
            include: {
                resident: {
                    include: {
                        room: true,
                        asalProvince: true
                    }
                },
            },
            orderBy: { createdAt: "desc" }
        })

        const monitorings = await prisma.monitoringPenugasan.findMany({
            where: {
                assignment: { satkerId }
            },
            orderBy: { tanggalMonitoring: "desc" },
            take: 5,
            include: {
                assignment: {
                    include: {
                        resident: true
                    }
                }
            }
        })

        const totalMonitorings = await prisma.monitoringPenugasan.count({
            where: { assignment: { satkerId } }
        })

        return {
            santri: assignments.map(a => ({
                id: a.resident.id,
                name: a.resident.name,
                nim: a.resident.nim || "N/A",
                position: a.position,
                room: a.resident.room?.number || "N/A",
                province: a.resident.asalProvince?.name || "N/A",
                status: a.status
            })),
            stats: {
                total: assignments.length,
                active: assignments.filter(a => a.status === "ACTIVE").length,
                completedTasks: totalMonitorings
            },
            recentTasks: monitorings.map(m => ({
                id: m.id,
                tanggal: m.tanggalMonitoring,
                status: m.statusMonitoring,
                predicate: m.predicate,
                residentName: m.assignment.resident.name,
            }))
        }
    } catch (error) {
        logOperationalError({ action: "Failed to fetch satker dashboard data", error })
        return {
            santri: [],
            stats: { total: 0, active: 0, completedTasks: 0 },
            recentTasks: []
        }
    }
}
