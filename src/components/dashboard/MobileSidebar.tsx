"use client"

import { useSidebar } from "@/components/providers/SidebarProvider"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import { X } from "lucide-react"

export default function MobileSidebar({
    userRole,
    permissions,
}: {
    userRole: string
    permissions?: string[]
}) {
    const { isOpen, setIsOpen } = useSidebar()
    const pathname = usePathname()

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setIsOpen(false)
    }, [pathname, setIsOpen])

    if (!isOpen) return null

    return (
        <div className="md:hidden z-50 fixed inset-0 flex">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Panel */}
            <div className="relative flex w-72 flex-col glass bg-white dark:bg-zinc-900/95 dark:bg-zinc-950/95 h-full transform transition-transform duration-300">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-2 z-50 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                <Sidebar userRole={userRole} permissions={permissions} />
            </div>
        </div>
    )
}
