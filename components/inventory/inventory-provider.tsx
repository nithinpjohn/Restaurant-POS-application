"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAudit } from "@/components/audit/audit-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { INITIAL_STOCK, LOW_STOCK } from "@/lib/data/stock"
import { ROUTES } from "@/lib/routes"

type Line = { id: number; name: string; qty: number }
type Ctx = {
  stock: Record<number, number>
  /** Deduct sold items and raise low / out-of-stock alerts when a threshold is crossed. */
  consume: (lines: Line[]) => void
  restock: (id: number, name: string, qty: number) => void
}

const KEY = "kans-resto-stock"
const InventoryContext = createContext<Ctx | null>(null)

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { log } = useAudit()
  const { notify } = useNotifications()
  const [stock, setStock] = useState(INITIAL_STOCK)
  const [ready, setReady] = useState(false)
  const ref = useRef(stock)
  ref.current = stock

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setStock(JSON.parse(raw)) } catch {}
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(stock)) } catch {}
  }, [stock, ready])

  const consume = useCallback<Ctx["consume"]>(
    (lines) => {
      const next = { ...ref.current }
      for (const l of lines) {
        const old = next[l.id]
        if (old === undefined) continue // untracked item
        const left = Math.max(0, old - l.qty)
        next[l.id] = left
        if (left === 0 && old > 0) {
          log({ category: "Inventory", action: "Out of stock", detail: l.name, flagged: true })
          notify({ title: `${l.name} is sold out`, description: "Restock it from the Menu page.", type: "error", href: ROUTES.menu })
        } else if (old > LOW_STOCK && left <= LOW_STOCK) {
          log({ category: "Inventory", action: "Low stock", detail: `${l.name} · ${left} left` })
          notify({ title: `Low stock: ${l.name}`, description: `Only ${left} left.`, type: "warning", href: ROUTES.menu })
        }
      }
      ref.current = next
      setStock(next)
    },
    [log, notify],
  )

  const restock = useCallback<Ctx["restock"]>(
    (id, name, qty) => {
      setStock((s) => ({ ...s, [id]: (s[id] ?? 0) + qty }))
      log({ category: "Inventory", action: "Restocked", detail: `${name} +${qty}` })
      notify({ title: `${name} restocked`, description: `+${qty} added.`, persist: false })
    },
    [log, notify],
  )

  const value = useMemo(() => ({ stock, consume, restock }), [stock, consume, restock])
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>")
  return ctx
}
