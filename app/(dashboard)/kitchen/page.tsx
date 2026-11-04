"use client"

import { useEffect, useState } from "react"
import { IconAlertTriangle, IconArrowBackUp, IconChefHat, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PosHeader } from "@/components/layout/pos-header"
import { urgencyStyle } from "@/components/orders/order-meta"
import { useOrders, type Order } from "@/components/orders/orders-provider"
import { useNow } from "@/hooks/use-now"
import { COURSE_NAMES, courseOf, formatElapsed, minutesSince, urgency } from "@/lib/kitchen"
import { delay } from "@/lib/mock"
import { cn } from "@/lib/utils"

function Ticket({ order, now, busy, onAction }: { order: Order; now: number | null; busy: boolean; onAction: () => void }) {
  const cooking = order.status === "Preparing"
  const level = now && cooking ? urgency(minutesSince(order.createdAt, now)) : "ok"
  const fired = order.details.filter((d) => order.fired.includes(courseOf(d.name)))
  const heldCourses = [...new Set(order.details.map((d) => courseOf(d.name)).filter((c) => !order.fired.includes(c)))].sort()
  const courses = [...new Set(fired.map((d) => courseOf(d.name)))].sort()

  return (
    <div className={cn("rounded-2xl border bg-card p-4", level === "late" ? "border-red-300" : "border-border")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{order.id}</p>
          <p className="text-xs text-muted-foreground">{order.table} · {order.time}</p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums", urgencyStyle[level])} suppressHydrationWarning>
          {now ? formatElapsed(cooking ? order.createdAt : order.readyAt ?? order.createdAt, now) : "--:--"}
          {level === "late" && " · LATE"}
        </span>
      </div>

      {!!order.allergies?.length && (
        <div role="alert" className="mb-2 flex items-start gap-1.5 rounded-xl bg-red-50 p-2 text-xs font-medium text-red-700">
          <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>ALLERGY: {order.allergies.join(", ")}</span>
        </div>
      )}

      <div className="space-y-2">
        {courses.map((c) => (
          <div key={c}>
            {order.details.some((d) => courseOf(d.name) !== c) && <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{COURSE_NAMES[c]}</p>}
            {fired.filter((d) => courseOf(d.name) === c).map((d, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{d.quantity}×</span> {d.name}
                {d.notes && <p className="ml-5 text-xs italic text-amber-700">{d.notes}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {heldCourses.length > 0 && (
        <p className="mt-2 rounded-lg bg-secondary px-2 py-1 text-xs text-muted-foreground">
          Held: {heldCourses.map((c) => COURSE_NAMES[c]).join(", ")}
        </p>
      )}

      <Button className="mt-3 h-10 w-full gap-1.5 rounded-xl" variant={cooking ? "default" : "outline"} disabled={busy} onClick={onAction}>
        {busy ? <Spinner /> : cooking ? <IconCheck className="h-4 w-4" /> : <IconArrowBackUp className="h-4 w-4" />}
        {cooking ? "Ready" : "Recall to kitchen"}
      </Button>
    </div>
  )
}

export default function KitchenPage() {
  const { orders, setStatus, ready } = useOrders()
  const now = useNow(1000)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => { delay(500).then(() => setLoading(false)) }, [])

  const cooking = orders.filter((o) => o.status === "Preparing").sort((a, b) => a.createdAt - b.createdAt)
  const done = orders.filter((o) => o.status === "Ready").sort((a, b) => (a.readyAt ?? a.createdAt) - (b.readyAt ?? b.createdAt))
  const late = now ? cooking.filter((o) => urgency(minutesSince(o.createdAt, now)) === "late").length : 0

  const act = async (o: Order) => {
    setBusyId(o.id)
    await delay(350)
    setStatus(o.id, o.status === "Preparing" ? "Ready" : "Preparing")
    setBusyId(null)
  }

  const busy = loading || !ready
  const skeleton = Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />
      <main className="flex-1 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground"><IconChefHat className="h-6 w-6" /> Kitchen Display</h1>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-secondary px-3 py-1">{cooking.length} cooking</span>
            {late > 0 && <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">{late} late</span>}
            <span className="rounded-full bg-secondary px-3 py-1">{done.length} ready</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">IN PROGRESS</h2>
            <div className="grid gap-4 md:grid-cols-2" aria-busy={busy}>
              {busy ? skeleton
                : cooking.length === 0 ? <p className="col-span-full rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">No orders cooking. New orders appear here automatically.</p>
                : cooking.map((o) => <Ticket key={o.id} order={o} now={now} busy={busyId === o.id} onAction={() => act(o)} />)}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">READY FOR PICKUP</h2>
            <div className="grid gap-4" aria-busy={busy}>
              {busy ? skeleton.slice(0, 2)
                : done.length === 0 ? <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Nothing waiting.</p>
                : done.map((o) => <Ticket key={o.id} order={o} now={now} busy={busyId === o.id} onAction={() => act(o)} />)}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
