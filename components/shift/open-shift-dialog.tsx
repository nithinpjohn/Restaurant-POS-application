"use client"

import { useState } from "react"
import { IconPlayerPlay } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useShift } from "@/components/shift/shift-provider"
import { delay } from "@/lib/mock"
import { parseMoney } from "@/lib/money"

export function OpenShiftDialog({ size = "default" }: { size?: "default" | "sm" }) {
  const { openShift } = useShift()
  const [open, setOpen] = useState(false)
  const [float, setFloat] = useState("200.00")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    await delay(500)
    openShift(parseMoney(float))
    setBusy(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} className="gap-2 rounded-xl"><IconPlayerPlay className="h-4 w-4" /> Open shift</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Open shift</DialogTitle>
          <DialogDescription>Count the cash in the drawer and enter it as the opening float.</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs text-muted-foreground">Opening float</Label>
          <Input className="mt-1 rounded-xl border-0 bg-secondary" type="number" min="0" step="0.01" value={float} onChange={(e) => setFloat(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || parseMoney(float) < 0}>{busy && <Spinner />}Open shift</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
