import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import RoomsClient from "@/components/dashboard/RoomsClient"

export const metadata = {
    title: "Manajemen Kamar | SPThree Connect",
}

export default async function RoomsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    // Cek modul permission apabila ada, jika tidak, bisa dilewati atau dibuat default allow untuk admin.
    // if (!session.user.permissions?.includes("room.view")) {
    //   redirect("/dashboard/forbidden")
    // }

    const rooms = await prisma.room.findMany({
        include: {
            residents: {
                select: {
                    id: true,
                    name: true,
                    nim: true
                }
            }
        },
        orderBy: [
            { floor: 'asc' },
            { number: 'asc' }
        ]
    })

    return (
        <div className="p-2 md:p-6 pb-20">
            <RoomsClient initialRooms={rooms} />
        </div>
    )
}
