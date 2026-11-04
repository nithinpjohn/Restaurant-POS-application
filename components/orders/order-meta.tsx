"use client"

import { IconCheck, IconClock, IconFlame } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { COURSE_NAMES, coursesIn, formatElapsed, minutesSince, urgency } from "@/lib/kitchen"
import { cn } from "@/lib/utils"
import { useOrders, type Order } from "./orders-provider"

export const urgencyStyle = {
  ok: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-700",
  late: "bg-red-100 text-red-700",
}

/** Kitchen timer (while cooking) and per-course fire controls for one order. */
export function OrderMeta({ order }: { order: Order }) {
  const now = useNow(1000)
  const { fireCourse } = useOrders()
  const courses = coursesIn(order.details.map((d) => d.name))
  const cooking = order.status === "Preparing"
  const level = now ? urgency(minutesSince(order.createdAt, now)) : "ok"

  if (!cooking && courses.length < 2) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {cooking && (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", urgencyStyle[level])} suppressHydrationWarning>
          <IconClock className="h-3 w-3" />
          {now ? formatElapsed(order.createdAt, now) : "--:--"}
          {level === "late" && " · Late"}
        </span>
      )}
      {courses.length > 1 &&
        courses.map((c) =>
          order.fired.includes(c) ? (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <IconCheck className="h-3 w-3" /> {COURSE_NAMES[c]}
            </span>
          ) : (
            <Button key={c} size="sm" variant="outline" className="h-6 gap-1 rounded-full px-2 text-xs" disabled={!cooking} onClick={() => fireCourse(order.id, c)}>
              <IconFlame className="h-3 w-3 text-orange-500" /> Fire {COURSE_NAMES[c].toLowerCase()}
            </Button>
          ),
        )}
    </div>
  )
}
