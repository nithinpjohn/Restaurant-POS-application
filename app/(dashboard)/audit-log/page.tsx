"use client"

import { useEffect, useState } from "react"
import { IconDownload, IconFlag, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PosHeader } from "@/components/layout/pos-header"
import { useAudit, type AuditCategory } from "@/components/audit/audit-provider"
import { delay } from "@/lib/mock"
import { IconLock } from "@tabler/icons-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useApproval } from "@/components/auth/approval-provider"
import { cn } from "@/lib/utils"

const categories: ("All" | AuditCategory)[] = ["All", "Menu", "Order", "Payment", "Table", "Allergen", "Inventory", "Shift", "Safety", "System"]

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`

export default function AuditLogPage() {
  const { entries, ready } = useAudit()
  const { can } = useAuth()
  const { requestApproval } = useApproval()
  const [unlocked, setUnlocked] = useState(false)
  const [category, setCategory] = useState<(typeof categories)[number]>("All")
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { delay(500).then(() => setLoading(false)) }, [])

  const shown = entries.filter(
    (e) =>
      (category === "All" || e.category === category) &&
      (!flaggedOnly || e.flagged) &&
      `${e.action} ${e.detail ?? ""} ${e.actor}`.toLowerCase().includes(q.toLowerCase()),
  )

  const exportCsv = async () => {
    setExporting(true)
    await delay(400)
    const rows = [["Time", "User", "Category", "Action", "Detail", "Flagged"], ...shown.map((e) => [new Date(e.at).toISOString(), e.actor, e.category, e.action, e.detail, e.flagged ? "yes" : ""])]
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" }))
    const a = Object.assign(document.createElement("a"), { href: url, download: `audit-log-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const busy = loading || !ready

  if (!can("audit.view") && !unlocked) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PosHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <IconLock className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Manager access required</h1>
          <p className="max-w-sm text-sm text-muted-foreground">The audit log is limited to managers. A manager can approve access with their PIN.</p>
          <Button className="rounded-xl" onClick={async () => setUnlocked(await requestApproval({ perm: "audit.view", reason: "Open the audit log" }))}>Enter manager PIN</Button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Audit Log</h1>
            <p className="text-sm text-muted-foreground">Who changed what, and when. Stored in this browser only.</p>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl" disabled={!shown.length || exporting} onClick={exportCsv}>
            <IconDownload className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="rounded-xl border-0 bg-secondary pl-9" placeholder="Search log…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary")}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setFlaggedOnly((f) => !f)}
            className={cn("flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", flaggedOnly ? "border-red-500 bg-red-50 text-red-700" : "border-border bg-card hover:bg-secondary")}
          >
            <IconFlag className="h-3.5 w-3.5" /> Flagged
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busy
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                : shown.length === 0
                  ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No audit entries yet. Actions you take in the app will appear here.</TableCell></TableRow>
                  : shown.map((e) => (
                      <TableRow key={e.id} className={cn(e.flagged && "bg-red-50/60")}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{e.actor}</TableCell>
                        <TableCell className="text-sm">{e.category}</TableCell>
                        <TableCell className="text-sm font-medium">{e.flagged && <IconFlag className="mr-1 inline h-3.5 w-3.5 text-red-600" />}{e.action}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.detail}</TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
