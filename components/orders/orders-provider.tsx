"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAudit } from "@/components/audit/audit-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { initialOrders } from "@/lib/data/orders"
import { COURSE_NAMES, LATE_MIN, MAX_ALERT_AGE_MIN, minutesSince } from "@/lib/kitchen"
import { ROUTES } from "@/lib/routes"

export type OrderLine = { name: string; quantity: number; price: string; notes?: string }
export type Order = {
  id: string
  table: string
  items: number
  total: string
  status: string
  time: string
  date: string
  details: OrderLine[]
  createdAt: number
  /** Courses already sent to the kitchen. */
  fired: number[]
  allergies?: string[]
  lateAlerted?: boolean
  readyAt?: number
  paid?: boolean
}

type Ctx = {
  orders: Order[]
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  ready: boolean
  addOrder: (o: Order) => void
  nextOrderId: () => string
  setStatus: (id: string, status: string) => void
  fireCourse: (id: string, course: number) => void
}

const KEY = "kans-resto-orders"
// How long ago the demo orders were placed, so the kitchen has timers worth looking at.
const SEED_AGE_MIN: Record<string, number> = { "ORD-001": 22, "ORD-002": 18, "ORD-003": 9, "ORD-005": 14, "ORD-006": 25, "ORD-007": 3, "ORD-008": 10 }

const seed = (): Order[] =>
  initialOrders.map((o) => ({ ...o, createdAt: Date.now() - (SEED_AGE_MIN[o.id] ?? 120) * 60_000, fired: [1, 2, 3] }))

const OrdersContext = createContext<Ctx | null>(null)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { log } = useAudit()
  const { notify } = useNotifications()
  const [orders, setOrders] = useState<Order[]>(seed)
  const [ready, setReady] = useState(false)
  const ref = useRef(orders)
  ref.current = orders

  // Load saved orders after mount; keep other tabs (e.g. a kitchen screen) in sync.
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setOrders(JSON.parse(raw)) } catch {}
    setReady(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) try { setOrders(JSON.parse(e.newValue)) } catch {}
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(orders)) } catch {}
  }, [orders, ready])

  // Late-order alerts: once per order, for tickets still cooking past LATE_MIN.
  useEffect(() => {
    if (!ready) return
    const check = () => {
      const now = Date.now()
      const late = ref.current.filter((o) => {
        const m = minutesSince(o.createdAt, now)
        return o.status === "Preparing" && !o.lateAlerted && m >= LATE_MIN && m <= MAX_ALERT_AGE_MIN
      })
      if (!late.length) return
      setOrders((prev) => prev.map((o) => (late.some((l) => l.id === o.id) ? { ...o, lateAlerted: true } : o)))
      late.forEach((o) => {
        const m = Math.floor(minutesSince(o.createdAt, now))
        log({ category: "Order", action: `Order ${o.id} running late`, detail: `${o.table} · ${m} min in the kitchen`, flagged: true })
        notify({ title: `${o.id} is running late`, description: `${o.table} · ${m} min in the kitchen`, type: "warning", href: ROUTES.kitchen })
      })
    }
    check()
    const t = setInterval(check, 20_000)
    return () => clearInterval(t)
  }, [ready, log, notify])

  const nextOrderId = useCallback(() => {
    const max = ref.current.reduce((m, o) => Math.max(m, parseInt(o.id.replace(/\D/g, "")) || 0), 0)
    return `ORD-${String(max + 1).padStart(3, "0")}`
  }, [])

  const addOrder = useCallback((o: Order) => setOrders((prev) => [o, ...prev]), [])

  const setStatus = useCallback(
    (id: string, status: string) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status, readyAt: status === "Ready" ? Date.now() : o.readyAt } : o)))
      log({ category: "Order", action: `Order ${id} marked ${status}`, detail: "From kitchen display" })
      if (status === "Ready") notify({ title: `Order ${id} is ready`, description: "Ready to be served.", href: ROUTES.orders })
    },
    [log, notify],
  )

  const fireCourse = useCallback(
    (id: string, course: number) => {
      setOrders((prev) => prev.map((o) => (o.id === id && !o.fired.includes(course) ? { ...o, fired: [...o.fired, course].sort() } : o)))
      log({ category: "Order", action: `Course ${course} fired`, detail: `${id} · ${COURSE_NAMES[course]}` })
      notify({ title: `Course ${course} fired`, description: `${id} · ${COURSE_NAMES[course]} sent to the kitchen.`, type: "info", href: ROUTES.kitchen })
    },
    [log, notify],
  )

  const value = useMemo(() => ({ orders, setOrders, ready, addOrder, nextOrderId, setStatus, fireCourse }), [orders, ready, addOrder, nextOrderId, setStatus, fireCourse])
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>")
  return ctx
}
