"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAudit } from "@/components/audit/audit-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"

export type QueueItem = {
  id: string
  kind: "order" | "sale"
  payload: unknown
  createdAt: number
  attempts: number
  error?: string
  /** Rejected by the server (4xx): kept for review, never retried automatically. */
  failed?: boolean
}

type Ctx = {
  online: boolean
  forcedOffline: boolean
  setForcedOffline: (v: boolean) => void
  queue: QueueItem[]
  pendingIds: Set<string>
  syncing: boolean
  lastSyncedAt: number | null
  enqueue: (kind: QueueItem["kind"], id: string, payload: unknown) => void
  syncNow: () => void
  clearFailed: () => void
}

const KEY = "kans-resto-outbox"
const ENDPOINT = "/api/sync"
const PING_MS = 10_000
const SyncContext = createContext<Ctx | null>(null)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { log } = useAudit()
  const { notify } = useNotifications()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [ready, setReady] = useState(false)
  const [browserOnline, setBrowserOnline] = useState(true)
  const [reachable, setReachable] = useState(true)
  const [forcedOffline, setForcedOffline] = useState(false) // demo switch for testing without unplugging
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const flushing = useRef(false)
  const queueRef = useRef(queue)
  queueRef.current = queue

  const online = browserOnline && reachable && !forcedOffline

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setQueue(JSON.parse(raw)) } catch {}
    setBrowserOnline(navigator.onLine)
    setReady(true)
    const up = () => setBrowserOnline(true)
    const down = () => setBrowserOnline(false)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down) }
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(queue)) } catch {}
  }, [queue, ready])

  // navigator.onLine only knows about the network card, so also ping the server.
  useEffect(() => {
    if (!ready || !browserOnline || forcedOffline) return
    let live = true
    const ping = async () => {
      try {
        const res = await fetch(ENDPOINT, { cache: "no-store", signal: AbortSignal.timeout(4000) })
        if (live) setReachable(res.ok)
      } catch {
        if (live) setReachable(false)
      }
    }
    ping()
    const t = setInterval(ping, PING_MS)
    return () => { live = false; clearInterval(t) }
  }, [ready, browserOnline, forcedOffline])

  // Tell the user when connectivity changes (not on first load).
  const prevOnline = useRef<boolean | null>(null)
  useEffect(() => {
    if (!ready) return
    if (prevOnline.current !== null && prevOnline.current !== online) {
      if (online) notify({ title: "Back online", description: queueRef.current.length ? "Syncing saved orders…" : "Everything is up to date.", type: "success", persist: false })
      else notify({ title: "You're offline", description: "Orders are saved on this device and sync when you reconnect.", type: "warning" })
    }
    prevOnline.current = online
  }, [online, ready, notify])

  const flush = useCallback(async () => {
    if (flushing.current) return
    const todo = queueRef.current.filter((i) => !i.failed)
    if (!todo.length) return
    flushing.current = true
    setSyncing(true)
    let sent = 0
    let rejected = 0
    for (const item of todo) {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: item.kind, id: item.id, payload: item.payload }),
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          sent++
          setQueue((q) => q.filter((x) => !(x.kind === item.kind && x.id === item.id)))
        } else if (res.status >= 400 && res.status < 500) {
          rejected++
          const msg = `Rejected (${res.status})`
          setQueue((q) => q.map((x) => (x.kind === item.kind && x.id === item.id ? { ...x, failed: true, error: msg, attempts: x.attempts + 1 } : x)))
        } else throw new Error(`Server error ${res.status}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error"
        setQueue((q) => q.map((x) => (x.kind === item.kind && x.id === item.id ? { ...x, attempts: x.attempts + 1, error: msg } : x)))
        setReachable(false) // stop; the ping will flip us back online and retry
        break
      }
    }
    flushing.current = false
    setSyncing(false)
    if (sent) {
      setLastSyncedAt(Date.now())
      log({ category: "System", action: "Offline queue synced", detail: `${sent} record${sent > 1 ? "s" : ""} sent` })
      notify({ title: `${sent} record${sent > 1 ? "s" : ""} synced`, description: "Saved offline work reached the server.", persist: false })
    }
    if (rejected) {
      log({ category: "System", action: "Sync rejected by server", detail: `${rejected} record${rejected > 1 ? "s" : ""} need review`, flagged: true })
      notify({ title: `${rejected} record${rejected > 1 ? "s" : ""} rejected by the server`, description: "Open the sync panel to review.", type: "error" })
    }
  }, [log, notify])

  // Send whenever we are online and something is waiting (new item, reconnect).
  const waiting = queue.filter((i) => !i.failed).length
  useEffect(() => {
    if (ready && online && waiting) flush()
  }, [ready, online, waiting, flush])

  const enqueue = useCallback<Ctx["enqueue"]>((kind, id, payload) => {
    setQueue((q) => (q.some((x) => x.kind === kind && x.id === id) ? q : [...q, { id, kind, payload, createdAt: Date.now(), attempts: 0 }]))
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      online,
      forcedOffline,
      setForcedOffline,
      queue,
      pendingIds: new Set(queue.filter((i) => i.kind === "order").map((i) => i.id)),
      syncing,
      lastSyncedAt,
      enqueue,
      syncNow: () => { if (online) flush() },
      clearFailed: () => setQueue((q) => q.filter((i) => !i.failed)),
    }),
    [online, forcedOffline, queue, syncing, lastSyncedAt, enqueue, flush],
  )
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error("useSync must be used inside <SyncProvider>")
  return ctx
}
