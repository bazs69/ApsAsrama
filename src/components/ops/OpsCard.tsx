import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { motion } from "@/lib/ui/motion"
import { cn } from "@/lib/utils"

interface OpsCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
}

export function OpsCard({ title, description, icon: Icon, href }: OpsCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl",
        motion.fast,
        motion.scalePress
      )}
      tabIndex={0}
    >
      <Card 
        className={cn(
          "relative h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-md",
          "hover:-translate-y-0.5",
          motion.normal,
          motion.scaleHover
        )}
      >
        <CardContent className="p-6">
          <div className="absolute top-6 right-6">
            <Badge variant="secondary" size="xs" className="uppercase">
              Coming Soon
            </Badge>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className={cn(
                "p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl",
                "group-hover:scale-110 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40",
                motion.fast
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            <h3 
              className={cn(
                "text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-primary-400",
                motion.fast
              )}
            >
              {title}
            </h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
