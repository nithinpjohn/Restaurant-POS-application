import { fmt } from "@/lib/money"

export type ReceiptPayment = { label: string; method: string; cents: number; detail?: string }

export type ReceiptData = {
  orderId: string
  table: string
  items: { name: string; qty: number; cents: number }[]
  subtotal: number
  taxLines: { label: string; cents: number }[]
  tip: number
  loyalty: number
  total: number
  payments: ReceiptPayment[]
  paidAt: number
}

export function Receipt({ r }: { r: ReceiptData }) {
  const row = "flex justify-between"
  return (
    <div id="receipt" className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-sm print:max-w-none print:border-0 print:p-0">
      <div className="mb-4 text-center">
        <p className="text-lg font-semibold text-foreground">Kans Resto</p>
        <p className="text-xs text-muted-foreground">Receipt · {r.orderId} · {r.table}</p>
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>{new Date(r.paidAt).toLocaleString()}</p>
      </div>

      <div className="space-y-1 border-y border-dashed border-border py-3">
        {r.items.map((i, idx) => (
          <div key={idx} className={row}><span>{i.qty} × {i.name}</span><span>{fmt(i.cents)}</span></div>
        ))}
      </div>

      <div className="space-y-1 py-3">
        <div className={row}><span className="text-muted-foreground">Subtotal</span><span>{fmt(r.subtotal)}</span></div>
        {r.taxLines.map((t) => (
          <div key={t.label} className={row}><span className="text-muted-foreground">{t.label}</span><span>{fmt(t.cents)}</span></div>
        ))}
        {r.tip > 0 && <div className={row}><span className="text-muted-foreground">Tip</span><span>{fmt(r.tip)}</span></div>}
        {r.loyalty > 0 && <div className={row}><span className="text-muted-foreground">Loyalty points</span><span>-{fmt(r.loyalty)}</span></div>}
        <div className={`${row} border-t border-border pt-2 text-base font-semibold`}><span>Total</span><span>{fmt(r.total)}</span></div>
      </div>

      <div className="space-y-1 border-t border-dashed border-border pt-3">
        {r.payments.map((p, idx) => (
          <div key={idx} className={row}>
            <span className="text-muted-foreground">{p.label} · {p.method}{p.detail ? ` ${p.detail}` : ""}</span>
            <span>{fmt(p.cents)}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Thank you for dining with us!</p>
    </div>
  )
}
