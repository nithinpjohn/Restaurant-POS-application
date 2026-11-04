"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAudit } from "@/components/audit/audit-provider"
import { useAuth } from "@/components/auth/auth-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { ROUTES } from "@/lib/routes"

export const UNITS = [
  { id: "walk-in", name: "Walk-in fridge", min: 0, max: 5 },
  { id: "prep", name: "Prep fridge", min: 0, max: 5 },
  { id: "freezer", name: "Freezer", min: -25, max: -18 },
  { id: "hot", name: "Hot holding", min: 63, max: 90 },
] as const
export type UnitId = (typeof UNITS)[number]["id"]

export const OVERDUE_MS = 4 * 60 * 60_000 // readings are due every 4 hours
export const EXPIRY_WARN_DAYS = 2

export type Reading = { id: string; unitId: UnitId; at: number; temp: number; by: string; ok: boolean; action?: string }
export type Batch = { id: string; item: string; qty: string; expiresOn: string; addedAt: number; discarded?: { at: number; by: string; reason: string } }

type State = { readings: Reading[]; batches: Batch[]; overdueAlerted: Record<string, number>; expiryCheckedOn: string }

const KEY = "kans-resto-food-safety"
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
export const isoDay = (d: Date) => d.toLocaleDateString("en-CA") // YYYY-MM-DD in local time
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDay(d) }
const ago = (min: number) => Date.now() - min * 60_000

/** Whole days from today (local) until `expiresOn`; negative = already expired. */
export const daysUntil = (expiresOn: string, now: number) =>
  Math.round((Date.parse(`${expiresOn}T00:00:00`) - Date.parse(`${isoDay(new Date(now))}T00:00:00`)) / 86_400_000)

export const inRange = (unitId: UnitId, temp: number) => {
  const u = UNITS.find((x) => x.id === unitId)!
  return temp >= u.min && temp <= u.max
}

const seed = (): State => ({
  readings: [
    { id: "r1", unitId: "hot", at: ago(30), temp: 68, by: "Tom Reyes", ok: true },
    { id: "r2", unitId: "walk-in", at: ago(60), temp: 3.5, by: "Sara Lee", ok: true },
    { id: "r3", unitId: "prep", at: ago(120), temp: 4.2, by: "Sara Lee", ok: true },
    { id: "r4", unitId: "freezer", at: ago(300), temp: -20, by: "Tom Reyes", ok: true },
  ],
  batches: [
    { id: "b1", item: "Double cream", qty: "4 L", expiresOn: inDays(-1), addedAt: ago(5000) },
    { id: "b2", item: "Chicken breast", qty: "6 kg", expiresOn: inDays(1), addedAt: ago(3000) },
    { id: "b3", item: "Salmon fillets", qty: "3 kg", expiresOn: inDays(2), addedAt: ago(2000) },
    { id: "b4", item: "Romaine lettuce", qty: "12 heads", expiresOn: inDays(6), addedAt: ago(1000) },
    { id: "b5", item: "Parmesan", qty: "2 kg", expiresOn: inDays(25), addedAt: ago(8000) },
  ],
  overdueAlerted: {},
  expiryCheckedOn: "",
})

type Ctx = State & {
  ready: boolean
  logReading: (unitId: UnitId, temp: number, action?: string) => void
  addBatch: (b: { item: string; qty: string; expiresOn: string }) => void
  discardBatch: (id: string, reason: string) => void
}

const Context = createContext<Ctx | null>(null)

export function FoodSafetyProvider({ children }: { children: React.ReactNode }) {
  const { log } = useAudit()
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [state, setState] = useState<State>(seed)
  const [ready, setReady] = useState(false)
  const ref = useRef(state)
  ref.current = state

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setState({ ...seed(), ...JSON.parse(raw) }) } catch {}
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  }, [state, ready])

  // Overdue temperature checks: alert once per unit until a new reading is logged.
  useEffect(() => {
    if (!ready) return
    const check = () => {
      const now = Date.now()
      const alerted = { ...ref.current.overdueAlerted }
      let changed = false
      for (const u of UNITS) {
        const lastAt = Math.max(0, ...ref.current.readings.filter((r) => r.unitId === u.id).map((r) => r.at))
        if (now - lastAt > OVERDUE_MS && alerted[u.id] !== lastAt) {
          alerted[u.id] = lastAt
          changed = true
          notify({ title: `${u.name} temperature check overdue`, description: "No reading in the last 4 hours.", type: "warning", href: ROUTES.foodSafety })
          log({ category: "Safety", action: "Temperature check overdue", detail: u.name, flagged: true })
        }
      }
      if (changed) setState((s) => ({ ...s, overdueAlerted: alerted }))
    }
    check()
    const t = setInterval(check, 60_000)
    return () => clearInterval(t)
  }, [ready, log, notify])

  // Expiry summary once per calendar day.
  useEffect(() => {
    if (!ready) return
    const today = isoDay(new Date())
    if (ref.current.expiryCheckedOn === today) return
    const live = ref.current.batches.filter((b) => !b.discarded)
    const expired = live.filter((b) => daysUntil(b.expiresOn, Date.now()) < 0)
    const soon = live.filter((b) => { const d = daysUntil(b.expiresOn, Date.now()); return d >= 0 && d <= EXPIRY_WARN_DAYS })
    if (expired.length) notify({ title: `${expired.length} item${expired.length > 1 ? "s" : ""} expired`, description: expired.map((b) => b.item).join(", "), type: "error", href: ROUTES.foodSafety })
    if (soon.length) notify({ title: `${soon.length} item${soon.length > 1 ? "s" : ""} expiring soon`, description: soon.map((b) => b.item).join(", "), type: "warning", href: ROUTES.foodSafety })
    setState((s) => ({ ...s, expiryCheckedOn: today }))
  }, [ready, notify])

  const logReading = useCallback<Ctx["logReading"]>(
    (unitId, temp, action) => {
      const u = UNITS.find((x) => x.id === unitId)!
      const ok = inRange(unitId, temp)
      setState((s) => ({ ...s, readings: [{ id: uid(), unitId, at: Date.now(), temp, by: user.name, ok, action }, ...s.readings].slice(0, 200) }))
      log({ category: "Safety", action: ok ? "Temperature logged" : "Temperature out of range", detail: `${u.name} ${temp}°C${action ? ` · action: ${action}` : ""}`, flagged: !ok })
      if (ok) notify({ title: `${u.name}: ${temp}°C`, description: "Within range.", persist: false })
      else notify({ title: `${u.name} out of range`, description: `${temp}°C (allowed ${u.min} to ${u.max}°C). Action recorded.`, type: "error", href: ROUTES.foodSafety })
    },
    [log, notify, user.name],
  )

  const addBatch = useCallback<Ctx["addBatch"]>(
    (b) => {
      setState((s) => ({ ...s, batches: [{ ...b, id: uid(), addedAt: Date.now() }, ...s.batches] }))
      log({ category: "Inventory", action: "Batch added", detail: `${b.item} · ${b.qty} · expires ${b.expiresOn}` })
      notify({ title: "Batch added", description: `${b.item} expires ${b.expiresOn}.`, persist: false })
    },
    [log, notify],
  )

  const discardBatch = useCallback<Ctx["discardBatch"]>(
    (id, reason) => {
      const b = ref.current.batches.find((x) => x.id === id)
      setState((s) => ({ ...s, batches: s.batches.map((x) => (x.id === id ? { ...x, discarded: { at: Date.now(), by: user.name, reason } } : x)) }))
      if (b) {
        log({ category: "Inventory", action: "Batch discarded", detail: `${b.item} · ${b.qty} · ${reason}`, flagged: reason !== "Expired" })
        notify({ title: `${b.item} discarded`, description: reason, type: "info" })
      }
    },
    [log, notify, user.name],
  )

  const value = useMemo(() => ({ ...state, ready, logReading, addBatch, discardBatch }), [state, ready, logReading, addBatch, discardBatch])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useFoodSafety() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error("useFoodSafety must be used inside <FoodSafetyProvider>")
  return ctx
}
