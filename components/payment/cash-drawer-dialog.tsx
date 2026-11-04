"use client"

import { useState } from "react"
import { IconCash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAudit } from "@/components/audit/audit-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { fmt, parseMoney } from "@/lib/money"
import { delay } from "@/lib/mock"

const DENOMS = [10000, 5000, 2000, 1000, 500, 100, 25, 10, 5, 1] // cents

export function CashDrawerDialog() {
  const { log } = useAudit()
  const { notify } = useNotifications()
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState<Record<number, string>>({})
  const [expected, setExpected] = useState("200.00")
  const [saving, setSaving] = useState(false)

  const counted = DENOMS.reduce((sum, d) => sum + d * (parseInt(counts[d]) || 0), 0)
  const variance = counted - parseMoney(expected)

  const save = async () => {
    setSaving(true)
    await delay(600)
    setSaving(false)
    setOpen(false)
    log({ category: "Payment", action: "Cash drawer counted", detail: `Counted ${fmt(counted)} vs expected ${fmt(parseMoney(expected))} (variance ${fmt(variance)})`, flagged: variance !== 0 })
    notify({ title: "Cash drawer saved", description: variance === 0 ? "Drawer balances." : `Variance ${fmt(variance)}`, type: variance === 0 ? "success" : "warning" })
    setCounts({})
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl"><IconCash className="h-4 w-4" /> Cash drawer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cash drawer count</DialogTitle>
          <DialogDescription>Enter how many of each note and coin are in the drawer.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1">
          {DENOMS.map((d) => (
            <div key={d}>
              <Label className="text-xs text-muted-foreground">{fmt(d)}</Label>
              <Input type="number" min="0" className="mt-1 rounded-xl border-0 bg-secondary" value={counts[d] ?? ""} onChange={(e) => setCounts({ ...counts, [d]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded-xl bg-secondary p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Expected float</span>
            <Input className="h-8 w-28 rounded-lg border-0 bg-card text-right" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Counted</span><span>{fmt(counted)}</span></div>
          <div className={`flex justify-between border-t border-border pt-2 font-semibold ${variance === 0 ? "text-emerald-600" : "text-destructive"}`}>
            <span>Variance</span><span>{fmt(variance)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || counted === 0}>{saving && <Spinner />}Save count</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
