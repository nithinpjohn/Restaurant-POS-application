"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { IconBellOff, IconChecks } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { delay } from "@/lib/mock"
import { ROUTES } from "@/lib/routes"
import { NotificationItem, NotificationSkeleton } from "./notification-item"
import { useNotifications } from "./notifications-provider"

export function NotificationPanel() {
  const { notifications, unreadCount, panelOpen, setPanelOpen, markAllRead } = useNotifications()
  const [loading, setLoading] = useState(false)

  // Skeleton while the list "loads" each time the panel opens.
  useEffect(() => {
    if (!panelOpen) return
    let live = true
    setLoading(true)
    delay(500).then(() => live && setLoading(false))
    return () => { live = false }
  }, [panelOpen])

  return (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Notifications{unreadCount > 0 && ` (${unreadCount})`}</SheetTitle>
          <SheetDescription>Order, table and stock updates.</SheetDescription>
          <Button variant="ghost" size="sm" className="w-fit gap-1.5 px-2 text-xs" disabled={!unreadCount} onClick={markAllRead}>
            <IconChecks className="h-3.5 w-3.5" /> Mark all as read
          </Button>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 py-3">
          {loading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <IconBellOff className="h-8 w-8" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <NotificationItem key={n.id} n={n} onNavigate={() => setPanelOpen(false)} />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-4">
          <Button asChild variant="outline" className="w-full rounded-xl" onClick={() => setPanelOpen(false)}>
            <Link href={ROUTES.notifications}>View all notifications</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
