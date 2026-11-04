import { esc } from "@/lib/download"
import { fmt } from "@/lib/money"
import type { ZReport } from "./shift-provider"

const when = (ts: number) => new Date(ts).toLocaleString()

/** Label/value rows shared by the on-screen view, the printout and the CSV. `bold` marks totals. */
export function zRows(r: ZReport): { label: string; value: string; bold?: boolean; gap?: boolean }[] {
  return [
    { label: "Opened", value: `${when(r.openedAt)} · ${r.openedBy}` },
    { label: "Closed", value: `${when(r.closedAt)} · ${r.closedBy}` },
    { label: "Orders paid", value: String(r.orders), gap: true },
    { label: "Gross sales (before tax)", value: fmt(r.gross) },
    ...r.taxLines.map((t) => ({ label: t.label, value: fmt(t.cents) })),
    { label: "Tips", value: fmt(r.tips) },
    { label: "Loyalty points redeemed", value: `-${fmt(r.loyalty)}` },
    { label: "Total payments received", value: fmt(r.payments), bold: true, gap: true },
    ...Object.entries(r.byMethod).map(([m, c]) => ({ label: `  ${m}`, value: fmt(c) })),
    { label: `Refunds (${r.refundCount})`, value: `-${fmt(r.refunds)}`, gap: true },
    { label: `Voided orders (${r.voidCount})`, value: fmt(r.voids) },
    { label: "Net takings", value: fmt(r.net), bold: true },
    { label: "Opening float", value: fmt(r.openingFloat), gap: true },
    { label: "Expected cash in drawer", value: fmt(r.expectedCash) },
    { label: "Counted cash", value: fmt(r.counted) },
    { label: "Variance", value: fmt(r.variance), bold: true },
  ]
}

export function zReportCsv(r: ZReport) {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [["Z-report", r.number], ...zRows(r).map((x) => [x.label.trim(), x.value])].map((row) => row.map(cell).join(",")).join("\n")
}

export function zReportHtml(r: ZReport, business: string) {
  const rows = zRows(r)
    .map((x) => `${x.gap ? "<tr><td colspan=2><hr></td></tr>" : ""}<tr class="${x.bold ? "b" : ""}"><td>${esc(x.label)}</td><td>${esc(x.value)}</td></tr>`)
    .join("")
  return `<h1>${esc(business)}</h1><p class="c">Z-report ${esc(r.number)}</p><hr><table>${rows}</table>`
}

export function ZReportView({ r }: { r: ZReport }) {
  return (
    <div className="space-y-1 text-sm">
      {zRows(r).map((x, i) => (
        <div key={i}>
          {x.gap && <div className="my-2 border-t border-dashed border-border" />}
          <div className={`flex justify-between gap-4 ${x.bold ? "font-semibold" : ""} ${x.label === "Variance" && r.variance !== 0 ? "text-destructive" : ""}`}>
            <span className="whitespace-pre text-muted-foreground">{x.label}</span>
            <span className="text-right">{x.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
