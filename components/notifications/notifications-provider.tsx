"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast as sonner } from "sonner"
import { ROUTES } from "@/lib/routes"

export type NotificationType = "success" | "info" | "warning" | "error"

export type AppNotification = {
  id: string
  title: string
  description?: string
  type: NotificationType
  createdAt: number
  read: boolean
  href?: string
}

type NotifyInput = {
  title: string
  description?: string
  type?: NotificationType
  href?: string
  /** false = toast only, not kept in the notification list (e.g. form validation). */
  persist?: boolean
}

type Ctx = {
  notifications: AppNotification[]
  unreadCount: number
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  notify: (n: NotifyInput) => void
  /** Same call shape as the old useToast().toast, so existing pages keep working. */
  toast: (n: { title: string; description?: string; variant?: "default" | "destructive" }) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  clearAll: () => void
}

const NotificationsContext = createContext<Ctx | null>(null)

const mins = (m: number) => Date.now() - m * 60_000
const seed: AppNotification[] = [
  { id: "seed-1", type: "warning", title: "Low stock: Salmon", description: "Only 4 portions of Grilled Salmon left.", createdAt: mins(4), read: false, href: ROUTES.menu },
  { id: "seed-2", type: "success", title: "Order ORD-002 is ready", description: "Table 3 is waiting to be served.", createdAt: mins(12), read: false, href: ROUTES.orders },
  { id: "seed-3", type: "info", title: "Table 7 requested the bill", description: "Guests at Table 7 are ready to pay.", createdAt: mins(35), read: false, href: ROUTES.payment },
  { id: "seed-4", type: "info", title: "Daily report is ready", description: "Yesterday's sales summary is available.", createdAt: mins(180), read: true, href: ROUTES.reports },
]

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(seed)
  const [panelOpen, setPanelOpen] = useState(false)

  const notify = useCallback(
    ({ title, description, type = "success", href, persist = true }: NotifyInput) => {
      if (persist) {
        setNotifications((prev) => [
          { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description, type, href, createdAt: Date.now(), read: false },
          ...prev,
        ])
      }
      sonner[type](title, {
        description,
        action: href ? { label: "View", onClick: () => router.push(href) } : undefined,
      })
    },
    [router],
  )

  const toast = useCallback<Ctx["toast"]>(
    ({ title, description, variant }) =>
      variant === "destructive"
        ? notify({ title, description, type: "error", persist: false })
        : notify({ title, description, type: "success" }),
    [notify],
  )

  const value = useMemo<Ctx>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      panelOpen,
      setPanelOpen,
      notify,
      toast,
      markRead: (id) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllRead: () => setNotifications((p) => p.map((n) => ({ ...n, read: true }))),
      remove: (id) => setNotifications((p) => p.filter((n) => n.id !== id)),
      clearAll: () => setNotifications([]),
    }),
    [notifications, panelOpen, notify, toast],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>")
  return ctx
}
