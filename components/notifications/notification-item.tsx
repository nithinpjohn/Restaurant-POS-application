"use client"

import Link from "next/link"
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconX } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNotifications, type AppNotification, type NotificationType } from "./notifications-provider"

export const typeStyle: Record<NotificationType, { icon: typeof IconInfoCircle; className: string }> = {
  success: { icon: IconCircleCheck, className: "bg-emerald-100 text-emerald-600" },
  info: { icon: IconInfoCircle, className: "bg-blue-100 text-blue-600" },
  warning: { icon: IconAlertTriangle, className: "bg-amber-100 text-amber-600" },
  error: { icon: IconAlertOctagon, className: "bg-red-100 text-red-600" },
}

function timeAgo(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60_000))
  if (m < 1) return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

export function NotificationItem({ n, onNavigate }: { n: AppNotification; onNavigate?: () => void }) {
  const { markRead, remove } = useNotifications()
  const { icon: Icon, className } = typeStyle[n.type]

  const body = (
    <>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", className)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-foreground", !n.read && "font-semibold")}>{n.title}</p>
        {n.description && <p className="text-xs text-muted-foreground">{n.description}</p>}
        {/* suppressHydrationWarning: relative time differs between server and client render */}
        <p className="mt-1 text-[11px] text-muted-foreground" suppressHydrationWarning>{timeAgo(n.createdAt)}</p>
      </div>
    </>
  )
  const cls = "flex flex-1 items-start gap-3 text-left"

  return (
    <div className={cn("group flex items-start gap-2 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/60", !n.read && "bg-primary/5")}>
      {n.href ? (
        <Link href={n.href} className={cls} onClick={() => { markRead(n.id); onNavigate?.() }}>{body}</Link>
      ) : (
        <button className={cls} onClick={() => markRead(n.id)}>{body}</button>
      )}
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />}
      <button
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
        onClick={() => remove(n.id)}
      >
        <IconX className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function NotificationSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}
