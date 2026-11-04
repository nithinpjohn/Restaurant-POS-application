"use client"

import { useEffect, useState } from "react"
import { IconBuildingStore, IconDownload, IconFileCode, IconPlayerStop, IconPrinter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PosHeader } from "@/components/layout/pos-header"
import { useApproval } from "@/components/auth/approval-provider"
import { OpenShiftDialog } from "@/components/shift/open-shift-dialog"
import { useShift, type ZReport } from "@/components/shift/shift-provider"
import { ZReportView, zReportCsv, zReportHtml } from "@/components/shift/z-report"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { buildInvoice, invoiceToXml } from "@/lib/einvoice"
import { downloadFile, printHtml } from "@/lib/download"
import { delay } from "@/lib/mock"
import { fmt, parseMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

const card = "rounded-2xl border border-border bg-card p-5"

export default function ShiftPage() {
  const { shift, summary, expectedCash, sales, reports, seller, setSeller, closeShift, ready } = useShift()
  const { requestApproval } = useApproval()
  const { notify } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [counted, setCounted] = useState("")
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState<ZReport | null>(null)
  const [bizOpen, setBizOpen] = useState(false)
  const [biz, setBiz] = useState(seller)

  useEffect(() => { delay(500).then(() => setLoading(false)) }, [])

  const busy = loading || !ready
  const variance = parseMoney(counted) - expectedCash

  const startClose = async () => {
    if (!(await requestApproval({ perm: "shift.close", reason: "Close the shift" }))) return
    setCounted((expectedCash / 100).toFixed(2))
    setClosing(true)
  }

  const confirmClose = async () => {
    setSaving(true)
    await delay(700)
    const report = closeShift(parseMoney(counted))
    setSaving(false)
    setClosing(false)
    if (report) setViewing(report)
  }

  const print = (r: ZReport) => {
    if (!printHtml(`Z-report ${r.number}`, zReportHtml(r, seller.name))) notify({ title: "Allow pop-ups to print", type: "warning", persist: false })
  }

  const exportInvoice = (sale: (typeof sales)[number], fmtType: "json" | "xml") => {
    const inv = buildInvoice(sale, seller)
    if (fmtType === "json") downloadFile(`${sale.invoiceNo}.json`, JSON.stringify(inv, null, 2), "application/json")
    else downloadFile(`${sale.invoiceNo}.xml`, invoiceToXml(inv), "application/xml")
    notify({ title: `${sale.invoiceNo} exported`, description: fmtType.toUpperCase(), persist: false })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-foreground">Shift &amp; Z-report</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => { setBiz(seller); setBizOpen(true) }}><IconBuildingStore className="h-4 w-4" /> Business details</Button>
            {!busy && (shift ? (
              <Button variant="destructive" className="gap-2 rounded-xl" onClick={startClose}><IconPlayerStop className="h-4 w-4" /> Close shift</Button>
            ) : <OpenShiftDialog />)}
          </div>
        </div>

        <div className={card} aria-busy={busy}>
          {busy ? (
            <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : shift && summary ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Open</span>
                <span className="text-sm text-muted-foreground" suppressHydrationWarning>Since {new Date(shift.openedAt).toLocaleString()} · {shift.openedBy}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  ["Opening float", fmt(shift.openingFloat)],
                  ["Orders paid", String(summary.orders)],
                  ["Payments received", fmt(summary.payments)],
                  ["Expected cash", fmt(expectedCash)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="text-lg font-semibold">{v}</p></div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No shift is open. Open one to start taking payments.</p>
          )}
        </div>

        <div className={card}>
          <h3 className="mb-3 font-semibold text-foreground">Sales &amp; e-invoices</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Order</TableHead><TableHead>Time</TableHead><TableHead>Paid with</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">E-invoice</TableHead></TableRow></TableHeader>
            <TableBody>
              {busy ? [0, 1, 2].map((i) => <TableRow key={i}>{[0, 1, 2, 3, 4, 5].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                : sales.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No sales yet. Paid orders appear here.</TableCell></TableRow>
                : sales.slice(0, 30).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.invoiceNo}</TableCell>
                    <TableCell>{s.orderId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>{new Date(s.at).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{[...new Set(s.payments.map((p) => p.method))].join(", ")}</TableCell>
                    <TableCell className="text-right">{fmt(s.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => exportInvoice(s, "json")}><IconFileCode className="h-3.5 w-3.5" /> JSON</Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => exportInvoice(s, "xml")}><IconFileCode className="h-3.5 w-3.5" /> XML</Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className={card}>
          <h3 className="mb-3 font-semibold text-foreground">Z-reports</h3>
          {busy ? <Skeleton className="h-10 w-full" /> : reports.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Closing a shift creates a Z-report.</p>
          ) : (
            <ul className="divide-y divide-border">
              {reports.map((r) => (
                <li key={r.number} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="w-20 font-medium">{r.number}</span>
                  <span className="flex-1 text-muted-foreground" suppressHydrationWarning>{new Date(r.closedAt).toLocaleString()}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", r.variance === 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>Variance {fmt(r.variance)}</span>
                  <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setViewing(r)}>View</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Close shift */}
      <Dialog open={closing} onOpenChange={(o) => !saving && setClosing(o)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close shift</DialogTitle>
            <DialogDescription>Count the drawer and enter the total cash. A Z-report is created and the shift ends.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between rounded-xl bg-secondary p-3 text-sm"><span className="text-muted-foreground">Expected cash</span><span className="font-semibold">{fmt(expectedCash)}</span></div>
            <div>
              <Label className="text-xs text-muted-foreground">Counted cash</Label>
              <Input className="mt-1 rounded-xl border-0 bg-secondary" type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} />
            </div>
            <div className={cn("flex justify-between rounded-xl p-3 text-sm font-semibold", variance === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
              <span>Variance</span><span>{fmt(variance)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setClosing(false)}>Cancel</Button>
            <Button variant="destructive" disabled={saving || counted === ""} onClick={confirmClose}>{saving && <Spinner />}Close shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Z-report viewer */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Z-report {viewing?.number}</DialogTitle>
            <DialogDescription>{seller.name}</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto pr-1">{viewing && <ZReportView r={viewing} />}</div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="gap-1.5 rounded-xl" onClick={() => viewing && downloadFile(`${viewing.number}.csv`, zReportCsv(viewing), "text/csv")}><IconDownload className="h-4 w-4" /> CSV</Button>
            <Button className="gap-1.5 rounded-xl" onClick={() => viewing && print(viewing)}><IconPrinter className="h-4 w-4" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business details (used on e-invoices) */}
      <Dialog open={bizOpen} onOpenChange={setBizOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Business details</DialogTitle>
            <DialogDescription>Printed on Z-reports and e-invoices as the seller.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {([["name", "Business name"], ["taxId", "Tax / VAT / GST ID"], ["address", "Address"]] as const).map(([k, label]) => (
              <div key={k}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input className="mt-1 rounded-xl border-0 bg-secondary" value={biz[k]} onChange={(e) => setBiz({ ...biz, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBizOpen(false)}>Cancel</Button>
            <Button disabled={!biz.name.trim() || !biz.taxId.trim()} onClick={() => { setSeller(biz); setBizOpen(false); notify({ title: "Business details saved", persist: false }) }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
