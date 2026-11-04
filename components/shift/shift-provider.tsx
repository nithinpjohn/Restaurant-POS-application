"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAudit } from "@/components/audit/audit-provider"
import { useAuth } from "@/components/auth/auth-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { fmt } from "@/lib/money"
import { ROUTES } from "@/lib/routes"

export type Sale = {
  id: string
  invoiceNo: string
  orderId: string
  table: string
  at: number
  shiftId: string | null
  items: { name: string; qty: number; cents: number }[]
  subtotal: number
  taxLines: { label: string; cents: number }[]
  tip: number
  loyalty: number
  total: number
  payments: { method: string; cents: number }[]
}
export type Adjustment = { id: string; kind: "refund" | "void"; orderId: string; at: number; shiftId: string | null; cents: number; reason: string; method?: string }
export type Shift = { id: string; openedAt: number; openedBy: string; openingFloat: number }
export type Seller = { name: string; taxId: string; address: string }

export type Summary = {
  orders: number
  gross: number
  taxLines: { label: string; cents: number }[]
  tax: number
  tips: number
  loyalty: number
  payments: number
  byMethod: Record<string, number>
  refunds: number
  refundCount: number
  voids: number
  voidCount: number
  net: number
  cashRefunds: number
}
export type ZReport = Summary & {
  number: string
  openedAt: number
  closedAt: number
  openedBy: string
  closedBy: string
  openingFloat: number
  expectedCash: number
  counted: number
  variance: number
}

type Data = { shift: Shift | null; sales: Sale[]; adjustments: Adjustment[]; reports: ZReport[]; seller: Seller }

const KEY = "kans-resto-shift"
const EMPTY: Data = { shift: null, sales: [], adjustments: [], reports: [], seller: { name: "Kans Resto", taxId: "TAX-0000000", address: "123 Main Street" } }
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function summarize(data: Data, shiftId: string): Summary {
  const sales = data.sales.filter((s) => s.shiftId === shiftId)
  const adj = data.adjustments.filter((a) => a.shiftId === shiftId)
  const tax: Record<string, number> = {}
  const byMethod: Record<string, number> = {}
  sales.forEach((s) => {
    s.taxLines.forEach((t) => { tax[t.label] = (tax[t.label] ?? 0) + t.cents })
    s.payments.forEach((p) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + p.cents })
  })
  const refunds = adj.filter((a) => a.kind === "refund")
  const voids = adj.filter((a) => a.kind === "void")
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const taxLines = Object.entries(tax).map(([label, cents]) => ({ label, cents }))
  const payments = sum(Object.values(byMethod))
  return {
    orders: sales.length,
    gross: sum(sales.map((s) => s.subtotal)),
    taxLines,
    tax: sum(taxLines.map((t) => t.cents)),
    tips: sum(sales.map((s) => s.tip)),
    loyalty: sum(sales.map((s) => s.loyalty)),
    payments,
    byMethod,
    refunds: sum(refunds.map((a) => a.cents)),
    refundCount: refunds.length,
    voids: sum(voids.map((a) => a.cents)),
    voidCount: voids.length,
    net: payments - sum(refunds.map((a) => a.cents)),
    cashRefunds: sum(refunds.filter((a) => a.method === "Cash").map((a) => a.cents)),
  }
}

type Ctx = Data & {
  ready: boolean
  summary: Summary | null
  /** Cash that should be in the drawer right now (float + cash sales - cash refunds). */
  expectedCash: number
  openShift: (float: number) => void
  closeShift: (counted: number) => ZReport | null
  recordSale: (s: Omit<Sale, "id" | "invoiceNo" | "at" | "shiftId">) => void
  recordAdjustment: (a: Omit<Adjustment, "id" | "at" | "shiftId" | "method">) => void
  setSeller: (s: Seller) => void
}

const ShiftContext = createContext<Ctx | null>(null)

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { log } = useAudit()
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [data, setData] = useState<Data>(EMPTY)
  const [ready, setReady] = useState(false)
  const ref = useRef(data)
  ref.current = data

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setData({ ...EMPTY, ...JSON.parse(raw) }) } catch {}
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
  }, [data, ready])

  const summary = useMemo(() => (data.shift ? summarize(data, data.shift.id) : null), [data])
  const expectedCash = data.shift && summary ? data.shift.openingFloat + (summary.byMethod["Cash"] ?? 0) - summary.cashRefunds : 0

  const openShift = useCallback<Ctx["openShift"]>(
    (float) => {
      if (ref.current.shift) return
      const shift: Shift = { id: uid(), openedAt: Date.now(), openedBy: user.name, openingFloat: float }
      setData((d) => ({ ...d, shift }))
      log({ category: "Shift", action: "Shift opened", detail: `Opening float ${fmt(float)}` })
      notify({ title: "Shift opened", description: `Opening float ${fmt(float)}.`, href: ROUTES.shift })
    },
    [log, notify, user.name],
  )

  const closeShift = useCallback<Ctx["closeShift"]>(
    (counted) => {
      const d = ref.current
      if (!d.shift) return null
      const s = summarize(d, d.shift.id)
      const expected = d.shift.openingFloat + (s.byMethod["Cash"] ?? 0) - s.cashRefunds
      const report: ZReport = {
        ...s,
        number: `Z-${String(d.reports.length + 1).padStart(4, "0")}`,
        openedAt: d.shift.openedAt,
        closedAt: Date.now(),
        openedBy: d.shift.openedBy,
        closedBy: user.name,
        openingFloat: d.shift.openingFloat,
        expectedCash: expected,
        counted,
        variance: counted - expected,
      }
      setData({ ...d, shift: null, reports: [report, ...d.reports] })
      log({ category: "Shift", action: `Shift closed (${report.number})`, detail: `Counted ${fmt(counted)} vs expected ${fmt(expected)} · variance ${fmt(report.variance)}`, flagged: report.variance !== 0 })
      notify({ title: `Shift closed · ${report.number}`, description: report.variance === 0 ? "Drawer balanced." : `Cash variance ${fmt(report.variance)}.`, type: report.variance === 0 ? "success" : "warning", href: ROUTES.shift })
      return report
    },
    [log, notify, user.name],
  )

  const recordSale = useCallback<Ctx["recordSale"]>((s) => {
    setData((d) => ({
      ...d,
      sales: [{ ...s, id: uid(), invoiceNo: `INV-${1001 + d.sales.length}`, at: Date.now(), shiftId: d.shift?.id ?? null }, ...d.sales],
    }))
  }, [])

  const recordAdjustment = useCallback<Ctx["recordAdjustment"]>((a) => {
    setData((d) => {
      const method = d.sales.find((s) => s.orderId === a.orderId)?.payments[0]?.method
      return { ...d, adjustments: [{ ...a, id: uid(), at: Date.now(), shiftId: d.shift?.id ?? null, method }, ...d.adjustments] }
    })
  }, [])

  const setSeller = useCallback((seller: Seller) => setData((d) => ({ ...d, seller })), [])

  const value = useMemo(
    () => ({ ...data, ready, summary, expectedCash, openShift, closeShift, recordSale, recordAdjustment, setSeller }),
    [data, ready, summary, expectedCash, openShift, closeShift, recordSale, recordAdjustment, setSeller],
  )
  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
}

export function useShift() {
  const ctx = useContext(ShiftContext)
  if (!ctx) throw new Error("useShift must be used inside <ShiftProvider>")
  return ctx
}
