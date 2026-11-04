"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type AuditCategory = "Menu" | "Order" | "Payment" | "Table" | "Allergen" | "Inventory" | "System"

export type AuditEntry = {
  id: string
  at: number
  actor: string
  category: AuditCategory
  action: string
  detail?: string
  /** Flags entries a manager should review (overrides, deletions). */
  flagged?: boolean
}

type Ctx = {
  entries: AuditEntry[]
  ready: boolean
  log: (e: Omit<AuditEntry, "id" | "at" | "actor"> & { actor?: string }) => void
  clear: () => void
}

const KEY = "kans-resto-audit-log"
const MAX = 500

const AuditContext = createContext<Ctx | null>(null)

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useAuth()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [ready, setReady] = useState(false)

  // Load after mount so server and client render the same first pass.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(entries)) } catch {}
  }, [entries, ready])

  const log = useCallback<Ctx["log"]>((e) => {
    setEntries((prev) =>
      [{ ...e, actor: e.actor ?? actor, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: Date.now() }, ...prev].slice(0, MAX),
    )
  }, [actor])

  const value = useMemo(() => ({ entries, ready, log, clear: () => setEntries([]) }), [entries, ready, log])
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
}

export function useAudit() {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error("useAudit must be used inside <AuditProvider>")
  return ctx
}
