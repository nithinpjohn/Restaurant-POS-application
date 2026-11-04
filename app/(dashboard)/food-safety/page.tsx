"use client"

import { useEffect, useState } from "react"
import { IconTemperature, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PosHeader } from "@/components/layout/pos-header"
import { daysUntil, EXPIRY_WARN_DAYS, inRange, isoDay, OVERDUE_MS, UNITS, useFoodSafety, type UnitId } from "@/components/food-safety/food-safety-provider"
import { useNow } from "@/hooks/use-now"
import { delay } from "@/lib/mock"
import { cn } from "@/lib/utils"

const card = "rounded-2xl border border-border bg-card p-5"
const chip = { ok: "bg-emerald-100 text-emerald-700", warn: "bg-amber-100 text-amber-700", bad: "bg-red-100 text-red-700" }
const ago = (ts: number, now: number) => { const m = Math.round((now - ts) / 60_000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago` }
const REASONS = ["Expired", "Spoiled", "Contaminated", "Damaged"]

export default function FoodSafetyPage() {
  const { readings, batches, logReading, addBatch, discardBatch, ready } = useFoodSafety()
  const now = useNow(30_000)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<UnitId | null>(null)
  const [temp, setTemp] = useState("")
  const [action, setAction] = useState("")
  const [saving, setSaving] = useState(false)
  const [batch, setBatch] = useState({ item: "", qty: "", expiresOn: "" })
  const [discard, setDiscard] = useState<{ id: string; item: string } | null>(null)
  const [reason, setReason] = useState("")

  useEffect(() => { delay(500).then(() => setLoading(false)) }, [])
  const busy = loading || !ready

  const t = parseFloat(temp)
  const valid = !isNaN(t)
  const outOfRange = unit && valid && !inRange(unit, t)
  const selected = UNITS.find((u) => u.id === unit)

  const saveReading = async () => {
    if (!unit || !valid) return
    setSaving(true)
    await delay(500)
    logReading(unit, t, outOfRange ? action.trim() : undefined)
    setSaving(false); setUnit(null); setTemp(""); setAction("")
  }

  const live = batches.filter((b) => !b.discarded)

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />
      <main className="flex-1 p-6">
        <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-foreground"><IconTemperature className="h-6 w-6" /> Food safety</h1>

        <Tabs defaultValue="temps">
          <TabsList className="mb-4">
            <TabsTrigger value="temps">Temperatures</TabsTrigger>
            <TabsTrigger value="expiry">Expiry dates</TabsTrigger>
          </TabsList>

          <TabsContent value="temps" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={busy}>
              {busy ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />) : UNITS.map((u) => {
                const last = readings.find((r) => r.unitId === u.id)
                const overdue = now !== null && (!last || now - last.at > OVERDUE_MS)
                const state = overdue ? "warn" : last && !last.ok ? "bad" : "ok"
                return (
                  <div key={u.id} className={card}>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="font-medium">{u.name}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", chip[state])}>{overdue ? "Check due" : last && !last.ok ? "Out of range" : "OK"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Allowed {u.min} to {u.max}°C</p>
                    <p className="my-2 text-2xl font-semibold">{last ? `${last.temp}°C` : "—"}</p>
                    <p className="mb-3 text-xs text-muted-foreground" suppressHydrationWarning>{last && now ? `${ago(last.at, now)} · ${last.by}` : "No reading yet"}</p>
                    <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => { setUnit(u.id); setTemp(""); setAction("") }}>Log reading</Button>
                  </div>
                )
              })}
            </div>

            <div className={card}>
              <h3 className="mb-3 font-semibold">Recent readings</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Unit</TableHead><TableHead>Temp</TableHead><TableHead>Result</TableHead><TableHead>By</TableHead><TableHead>Time</TableHead><TableHead>Corrective action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {busy ? [0, 1, 2].map((i) => <TableRow key={i}>{[0, 1, 2, 3, 4, 5].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                    : readings.slice(0, 15).map((r) => (
                      <TableRow key={r.id} className={cn(!r.ok && "bg-red-50/60")}>
                        <TableCell>{UNITS.find((u) => u.id === r.unitId)?.name}</TableCell>
                        <TableCell>{r.temp}°C</TableCell>
                        <TableCell><span className={cn("rounded-full px-2 py-0.5 text-xs", r.ok ? chip.ok : chip.bad)}>{r.ok ? "OK" : "Out of range"}</span></TableCell>
                        <TableCell>{r.by}</TableCell>
                        <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>{new Date(r.at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.action ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="expiry" className="space-y-6">
            <div className={card}>
              <h3 className="mb-3 font-semibold">Add a batch</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input className="rounded-xl border-0 bg-secondary" placeholder="Item" value={batch.item} onChange={(e) => setBatch({ ...batch, item: e.target.value })} />
                <Input className="rounded-xl border-0 bg-secondary" placeholder="Quantity (e.g. 5 kg)" value={batch.qty} onChange={(e) => setBatch({ ...batch, qty: e.target.value })} />
                <Input className="rounded-xl border-0 bg-secondary" type="date" min={isoDay(new Date())} value={batch.expiresOn} onChange={(e) => setBatch({ ...batch, expiresOn: e.target.value })} />
                <Button className="rounded-xl" disabled={!batch.item.trim() || !batch.qty.trim() || !batch.expiresOn} onClick={() => { addBatch({ ...batch, item: batch.item.trim(), qty: batch.qty.trim() }); setBatch({ item: "", qty: "", expiresOn: "" }) }}>Add batch</Button>
              </div>
            </div>

            <div className={card}>
              <h3 className="mb-3 font-semibold">Batches</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {busy ? [0, 1, 2].map((i) => <TableRow key={i}>{[0, 1, 2, 3, 4].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                    : live.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No batches tracked.</TableCell></TableRow>
                    : [...live].sort((a, b) => a.expiresOn.localeCompare(b.expiresOn)).map((b) => {
                      const d = now === null ? null : daysUntil(b.expiresOn, now)
                      const s = d === null ? "ok" : d < 0 ? "bad" : d <= EXPIRY_WARN_DAYS ? "warn" : "ok"
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.item}</TableCell>
                          <TableCell>{b.qty}</TableCell>
                          <TableCell>{b.expiresOn}</TableCell>
                          <TableCell><span className={cn("rounded-full px-2 py-0.5 text-xs", chip[s])} suppressHydrationWarning>{d === null ? "…" : d < 0 ? `Expired ${-d}d ago` : d === 0 ? "Expires today" : `${d}d left`}</span></TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive" onClick={() => { setDiscard({ id: b.id, item: b.item }); setReason(d !== null && d < 0 ? "Expired" : "") }}><IconTrash className="h-3.5 w-3.5" /> Discard</Button></TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!unit} onOpenChange={(o) => !o && !saving && setUnit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log reading · {selected?.name}</DialogTitle>
            <DialogDescription>Allowed range {selected?.min} to {selected?.max}°C.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Temperature (°C)</Label>
              <Input className="mt-1 rounded-xl border-0 bg-secondary" type="number" step="0.1" autoFocus value={temp} onChange={(e) => setTemp(e.target.value)} />
            </div>
            {outOfRange && (
              <div>
                <p role="alert" className="mb-2 rounded-xl bg-red-50 p-2 text-xs font-medium text-red-700">Out of range. Record what you did about it.</p>
                <Input className="rounded-xl border-0 bg-secondary" placeholder="Corrective action (e.g. moved stock, called engineer)" value={action} onChange={(e) => setAction(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setUnit(null)}>Cancel</Button>
            <Button disabled={saving || !valid || (!!outOfRange && !action.trim())} onClick={saveReading}>{saving && <Spinner />}Save reading</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!discard} onOpenChange={(o) => !o && setDiscard(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Discard {discard?.item}</DialogTitle>
            <DialogDescription>Record why it is being thrown away. This is kept in the audit log.</DialogDescription>
          </DialogHeader>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="rounded-xl border-0 bg-secondary"><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reason} onClick={() => { if (discard) discardBatch(discard.id, reason); setDiscard(null) }}>Discard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
