"use client"

import { useEffect, useState } from "react"
import { IconBellOff, IconChecks, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { PosHeader } from "@/components/layout/pos-header"
import { NotificationItem, NotificationSkeleton } from "@/components/notifications/notification-item"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { Spinner } from "@/components/ui/spinner"
import { delay } from "@/lib/mock"
import { cn } from "@/lib/utils"

const filters = ["All", "Unread", "Alerts"] as const

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications()
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  useEffect(() => { delay(600).then(() => setLoading(false)) }, [])

  const shown = notifications.filter((n) =>
    filter === "Unread" ? !n.read : filter === "Alerts" ? n.type === "warning" || n.type === "error" : true,
  )

  const handleClear = async () => {
    setClearing(true)
    await delay(600)
    clearAll()
    setClearing(false)
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" disabled={!unreadCount} onClick={markAllRead}>
              <IconChecks className="h-4 w-4" /> Mark all read
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-destructive" disabled={!notifications.length || clearing} onClick={handleClear}>
              {clearing ? <Spinner /> : <IconTrash className="h-4 w-4" />} Clear all
            </Button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <NotificationSkeleton rows={6} />
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
            <IconBellOff className="h-10 w-10" />
            <p className="text-sm">No notifications here</p>
          </div>
        ) : (
          <div className="space-y-2">{shown.map((n) => <NotificationItem key={n.id} n={n} />)}</div>
        )}
      </main>
    </div>
  )
}
