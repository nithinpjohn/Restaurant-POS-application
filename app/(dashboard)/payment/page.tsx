"use client"

import { useState } from "react"
import { IconCircleCheck, IconCreditCard, IconMail, IconPrinter, IconUsersGroup } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { PosHeader } from "@/components/layout/pos-header"
import { CashDrawerDialog } from "@/components/payment/cash-drawer-dialog"
import { Receipt, type ReceiptData, type ReceiptPayment } from "@/components/payment/receipt"
import { useAudit } from "@/components/audit/audit-provider"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { useOrders } from "@/components/orders/orders-provider"
import Link from "next/link"
import { ROUTES } from "@/lib/routes"
import { allocate, fmt, luhn, parseMoney, TAX_RATES, validExpiry } from "@/lib/money"
import { delay } from "@/lib/mock"
import { cn } from "@/lib/utils"

const tipOptions = [
  { label: "15%", value: 0.15 },
  { label: "18%", value: 0.18 },
  { label: "20%", value: 0.2 },
]
const SPLITS = [
  { id: "none", label: "Whole bill" },
  { id: "equal", label: "Equal" },
  { id: "seat", label: "By seat" },
  { id: "amount", label: "By amount" },
] as const
const METHODS = [
  { id: "card", label: "Credit card" },
  { id: "cash", label: "Cash" },
  { id: "gift", label: "Gift card" },
  { id: "mobile", label: "Mobile payment" },
] as const
// ponytail: demo gift cards and loyalty balance; replace with backend lookups.
const GIFT_CARDS: Record<string, number> = { GIFT50: 5000, GIFT20: 2000 }
const START_POINTS = 1240 // 1 point = 1 cent

const chip = (on: boolean) =>
  cn("rounded-xl border px-3 py-2 text-sm font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary")
const field = "mt-1 rounded-xl border-0 bg-secondary"
const card = "rounded-2xl border border-border bg-card p-5"

export default function PaymentPage() {
  const { notify } = useNotifications()
  const { log } = useAudit()
  const { orders, setOrders } = useOrders()

  const openOrders = orders.filter((o) => !o.paid && !["Completed", "Voided", "Refunded"].includes(o.status))
  const [pickedId, setOrderId] = useState("")
  const orderId = orders.some((o) => o.id === pickedId) ? pickedId : openOrders[0]?.id ?? ""
  const [tipPreset, setTipPreset] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState("")
  const [poolTips, setPoolTips] = useState(false)
  const [poolStaff, setPoolStaff] = useState("3")
  const [redeem, setRedeem] = useState("")
  const [points, setPoints] = useState(START_POINTS)

  const [splitMode, setSplitMode] = useState<(typeof SPLITS)[number]["id"]>("none")
  const [splitN, setSplitN] = useState(2)
  const [seatOf, setSeatOf] = useState<Record<number, number>>({})
  const [payerAmounts, setPayerAmounts] = useState(["", ""])

  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("card")
  const [cardNo, setCardNo] = useState("")
  const [exp, setExp] = useState("")
  const [cvv, setCvv] = useState("")
  const [tendered, setTendered] = useState("")
  const [giftCode, setGiftCode] = useState("")
  const [giftLeft, setGiftLeft] = useState<number | null>(null)

  const [paid, setPaid] = useState<ReceiptPayment[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [paidAt, setPaidAt] = useState(0)
  const [email, setEmail] = useState("")
  const [emailing, setEmailing] = useState(false)

  // ---- money (integer cents) ----
  const order = orders.find((o) => o.id === orderId)
  if (!order) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PosHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">No orders awaiting payment</h1>
          <p className="text-sm text-muted-foreground">New orders show up here as soon as they are placed.</p>
          <Link href={ROUTES.newOrder} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Start a new order</Link>
        </main>
      </div>
    )
  }
  const items = order.details.map((d) => ({ name: d.name, qty: d.quantity, cents: parseMoney(d.price) }))
  const subtotal = parseMoney(order.total) // order total is treated as the pre-tax subtotal
  const taxLines = TAX_RATES.map((t) => ({ label: `${t.label} (${Math.round(t.rate * 100)}%)`, cents: Math.round(subtotal * t.rate) }))
  const tax = taxLines.reduce((a, t) => a + t.cents, 0)
  const tip = tipPreset !== null ? Math.round(subtotal * tipPreset) : parseMoney(customTip)
  const beforeLoyalty = subtotal + tax + tip
  const loyalty = Math.max(0, Math.min(parseInt(redeem) || 0, points, beforeLoyalty))
  const payable = beforeLoyalty - loyalty
  const staff = Math.max(1, parseInt(poolStaff) || 1)

  const seatCount = Math.max(2, splitN)
  const seatWeights = Array.from({ length: seatCount }, (_, s) =>
    items.reduce((sum, it, idx) => sum + ((seatOf[idx] ?? 0) === s ? it.cents : 0), 0),
  )
  const partCents: number[] =
    splitMode === "equal" ? allocate(payable, Array(Math.max(2, splitN)).fill(1))
    : splitMode === "seat" ? allocate(payable, seatWeights).filter((_, i) => seatWeights[i] > 0)
    : splitMode === "amount" ? payerAmounts.map(parseMoney)
    : [payable]
  const parts = partCents.map((cents, i) => ({ cents, label: splitMode === "none" ? "Full bill" : splitMode === "seat" ? `Seat ${seatWeights.map((w, s) => (w > 0 ? s + 1 : 0)).filter(Boolean)[i]}` : `Guest ${i + 1}` }))
  const amountMismatch = splitMode === "amount" && (partCents.reduce((a, b) => a + b, 0) !== payable || partCents.some((c) => c <= 0))

  const current = parts[paid.length]
  const done = parts.length > 0 && paid.length === parts.length
  const locked = paid.length > 0
  const change = parseMoney(tendered) - (current?.cents ?? 0)

  const resetTender = () => { setCardNo(""); setExp(""); setCvv(""); setTendered("") }

  const pay = async () => {
    if (!current || amountMismatch) return
    setError("")
    const digits = cardNo.replace(/\s/g, "")
    if (method === "card") {
      if (!luhn(digits)) return setError("Enter a valid card number (try 4242 4242 4242 4242).")
      if (!validExpiry(exp)) return setError("Enter a valid, unexpired date as MM/YY.")
      if (!/^\d{3,4}$/.test(cvv)) return setError("Enter the 3 or 4 digit security code.")
    }
    if (method === "cash" && change < 0) return setError("Cash received is less than the amount due.")
    if (method === "gift" && (giftLeft === null || giftLeft < current.cents)) return setError("Check the gift card balance first, or its balance is too low. Pay with another method.")

    setProcessing(true)
    await delay(1100)
    const payment: ReceiptPayment = {
      label: current.label,
      method: METHODS.find((m) => m.id === method)!.label,
      cents: current.cents,
      detail: method === "card" ? `•••• ${digits.slice(-4)}` : method === "cash" && change > 0 ? `(change ${fmt(change)})` : undefined,
    }
    const next = [...paid, payment]
    setPaid(next)
    if (method === "gift") setGiftLeft((giftLeft ?? 0) - current.cents)
    resetTender()
    setProcessing(false)
    log({ category: "Payment", action: `Payment taken (${payment.method})`, detail: `${order.id} · ${current.label} · ${fmt(current.cents)}${payment.detail ? ` ${payment.detail}` : ""}` })

    if (next.length === parts.length) {
      const earned = Math.floor(subtotal / 100)
      setPoints(points - loyalty + earned)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paid: true } : o)))
      setPaidAt(Date.now())
      if (tip > 0 && poolTips) log({ category: "Payment", action: "Tip pooled", detail: `${fmt(tip)} shared by ${staff} staff (${fmt(Math.floor(tip / staff))} each)` })
      log({ category: "Payment", action: "Order paid in full", detail: `${order.id} · ${fmt(payable)}${loyalty ? ` + ${loyalty} pts redeemed` : ""}` })
      notify({ title: "Payment complete", description: `${order.id} paid · ${fmt(payable)}. Earned ${earned} points.`, href: undefined })
    } else {
      notify({ title: `${current.label} paid`, description: `${next.length} of ${parts.length} payments received.`, type: "info" })
    }
  }

  const newPayment = () => {
    setPaid([]); setRedeem(""); setTipPreset(null); setCustomTip(""); setSplitMode("none"); setSeatOf({}); setPayerAmounts(["", ""]); setError(""); setEmail("")
    setOrderId("")
  }

  const sendEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return notify({ title: "Enter a valid email", type: "error", persist: false })
    setEmailing(true)
    await delay(900)
    setEmailing(false)
    log({ category: "Payment", action: "Receipt emailed", detail: `${order.id} → ${email.replace(/^(.).*(@.*)$/, "$1•••$2")}` })
    notify({ title: "Receipt sent", description: `Emailed to ${email}.` })
  }

  const receipt: ReceiptData = { orderId: order.id, table: order.table, items, subtotal, taxLines, tip, loyalty, total: payable, payments: paid, paidAt }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h1 className="text-xl font-semibold text-foreground">Process Payment</h1>
          <CashDrawerDialog />
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 print:hidden">
              <IconCircleCheck className="h-8 w-8 shrink-0 text-emerald-600" />
              <div>
                <h3 className="font-medium text-emerald-900">Payment successful</h3>
                <p className="text-sm text-emerald-700">You earned {Math.floor(subtotal / 100)} loyalty points.</p>
              </div>
            </div>
            <Receipt r={receipt} />
            <div className="mx-auto flex max-w-sm flex-col gap-2 print:hidden">
              <div className="flex gap-2">
                <Input className="rounded-xl border-0 bg-secondary" type="email" placeholder="customer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button variant="outline" className="gap-1.5 rounded-xl" disabled={emailing} onClick={sendEmail}>
                  {emailing ? <Spinner /> : <IconMail className="h-4 w-4" />} Email
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5 rounded-xl" onClick={() => window.print()}><IconPrinter className="h-4 w-4" /> Print</Button>
                <Button className="flex-1 rounded-xl" onClick={newPayment}>Next payment</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
            {/* Left: order, tip, split */}
            <div className="space-y-6">
              <div className={card}>
                <h3 className="mb-4 font-semibold text-foreground">Order Details</h3>
                <Label className="text-xs text-muted-foreground">Select Order</Label>
                <Select value={orderId} onValueChange={setOrderId} disabled={locked}>
                  <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {openOrders.map((o) => <SelectItem key={o.id} value={o.id}>{o.id} ({o.table})</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="mt-3 space-y-2 rounded-xl bg-secondary p-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Table</span><span>{order.table}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{order.items} items</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
                  {taxLines.map((t) => <div key={t.label} className="flex justify-between"><span className="text-muted-foreground">{t.label}</span><span>{fmt(t.cents)}</span></div>)}
                  <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><span>{fmt(tip)}</span></div>
                  {loyalty > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Loyalty points</span><span className="text-destructive">-{fmt(loyalty)}</span></div>}
                  <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Total due</span><span>{fmt(payable)}</span></div>
                </div>
              </div>

              <div className={card}>
                <h3 className="mb-3 font-semibold text-foreground">Tip</h3>
                <div className="flex gap-2">
                  {tipOptions.map((t) => (
                    <button key={t.label} disabled={locked} onClick={() => { setTipPreset(t.value); setCustomTip("") }} className={cn(chip(tipPreset === t.value), "flex-1")}>{t.label}</button>
                  ))}
                  <button disabled={locked} onClick={() => setTipPreset(null)} className={cn(chip(tipPreset === null && !!customTip), "flex-1")}>Custom</button>
                </div>
                {tipPreset === null && (
                  <Input className={field} placeholder="Custom tip amount" type="number" min="0" step="0.01" disabled={locked} value={customTip} onChange={(e) => setCustomTip(e.target.value)} />
                )}
                <div className="mt-4 flex items-center justify-between">
                  <Label htmlFor="pool" className="flex items-center gap-2 text-sm"><IconUsersGroup className="h-4 w-4 text-muted-foreground" /> Pool tips with staff</Label>
                  <Switch id="pool" checked={poolTips} onCheckedChange={setPoolTips} disabled={locked} />
                </div>
                {poolTips && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-secondary p-3 text-sm">
                    <Input className="h-8 w-16 rounded-lg border-0 bg-card text-center" type="number" min="1" value={poolStaff} onChange={(e) => setPoolStaff(e.target.value)} disabled={locked} />
                    <span className="text-muted-foreground">staff · {fmt(Math.floor(tip / staff))} each</span>
                  </div>
                )}
              </div>

              <div className={card}>
                <h3 className="mb-3 font-semibold text-foreground">Loyalty points</h3>
                <p className="mb-2 text-xs text-muted-foreground">Balance: {points} pts (100 pts = $1.00)</p>
                <div className="flex gap-2">
                  <Input className="rounded-xl border-0 bg-secondary" type="number" min="0" placeholder="Points to redeem" value={redeem} disabled={locked} onChange={(e) => setRedeem(e.target.value)} />
                  <Button variant="outline" className="rounded-xl" disabled={locked} onClick={() => setRedeem(String(Math.min(points, beforeLoyalty)))}>Max</Button>
                </div>
              </div>
            </div>

            {/* Right: split + payment */}
            <div className="space-y-6">
              <div className={card}>
                <h3 className="mb-3 font-semibold text-foreground">Split bill</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SPLITS.map((s) => <button key={s.id} disabled={locked} onClick={() => setSplitMode(s.id)} className={chip(splitMode === s.id)}>{s.label}</button>)}
                </div>

                {(splitMode === "equal" || splitMode === "seat") && (
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <Label className="text-muted-foreground">{splitMode === "equal" ? "Guests" : "Seats"}</Label>
                    <Input className="h-8 w-16 rounded-lg border-0 bg-secondary text-center" type="number" min="2" max="12" value={splitN} disabled={locked} onChange={(e) => setSplitN(Math.min(12, Math.max(2, parseInt(e.target.value) || 2)))} />
                  </div>
                )}

                {splitMode === "seat" && (
                  <div className="mt-3 space-y-2">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 truncate">{it.qty} × {it.name}</span>
                        <span className="text-muted-foreground">{fmt(it.cents)}</span>
                        <Select value={String(seatOf[idx] ?? 0)} onValueChange={(v) => setSeatOf({ ...seatOf, [idx]: +v })} disabled={locked}>
                          <SelectTrigger className="h-8 w-24 rounded-lg border-0 bg-secondary"><SelectValue /></SelectTrigger>
                          <SelectContent>{Array.from({ length: seatCount }, (_, s) => <SelectItem key={s} value={String(s)}>Seat {s + 1}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}

                {splitMode === "amount" && (
                  <div className="mt-3 space-y-2">
                    {payerAmounts.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-16 text-muted-foreground">Guest {i + 1}</span>
                        <Input className="h-9 rounded-xl border-0 bg-secondary" type="number" min="0" step="0.01" placeholder="0.00" value={a} disabled={locked}
                          onChange={(e) => setPayerAmounts(payerAmounts.map((x, j) => (j === i ? e.target.value : x)))} />
                        {payerAmounts.length > 2 && !locked && <Button variant="ghost" size="sm" onClick={() => setPayerAmounts(payerAmounts.filter((_, j) => j !== i))}>Remove</Button>}
                      </div>
                    ))}
                    {!locked && payerAmounts.length < 8 && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPayerAmounts([...payerAmounts, ""])}>Add guest</Button>}
                    <p className={cn("text-xs", amountMismatch ? "text-destructive" : "text-emerald-600")}>
                      {amountMismatch ? `Amounts must add up to ${fmt(payable)} (now ${fmt(partCents.reduce((a, b) => a + b, 0))}).` : "Amounts add up."}
                    </p>
                  </div>
                )}

                {parts.length > 1 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {parts.map((p, i) => (
                      <li key={i} className="flex justify-between rounded-lg bg-secondary px-3 py-1.5">
                        <span>{p.label}</span>
                        <span className={i < paid.length ? "text-emerald-600" : ""}>{fmt(p.cents)}{i < paid.length ? " · paid" : i === paid.length ? " · now" : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={card}>
                <h3 className="mb-4 font-semibold text-foreground">Payment Method{current && parts.length > 1 ? ` · ${current.label}` : ""}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {METHODS.map((m) => <button key={m.id} onClick={() => { setMethod(m.id); setError("") }} className={chip(method === m.id)}>{m.label}</button>)}
                  </div>

                  {method === "card" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Card Number</Label>
                        <Input className={field} inputMode="numeric" autoComplete="off" placeholder="XXXX XXXX XXXX XXXX" value={cardNo}
                          onChange={(e) => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                          <Input className={field} inputMode="numeric" placeholder="MM/YY" value={exp}
                            onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d) }} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">CVV</Label>
                          <Input className={field} type="password" inputMode="numeric" autoComplete="off" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                        </div>
                      </div>
                    </div>
                  )}

                  {method === "cash" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Cash received</Label>
                        <Input className={field} type="number" min="0" step="0.01" placeholder="0.00" value={tendered} onChange={(e) => setTendered(e.target.value)} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {current && <Button variant="outline" size="sm" className="rounded-full" onClick={() => setTendered((current.cents / 100).toFixed(2))}>Exact</Button>}
                        {[20, 50, 100].map((n) => <Button key={n} variant="outline" size="sm" className="rounded-full" onClick={() => setTendered(String(n))}>${n}</Button>)}
                      </div>
                      <div className={cn("flex justify-between rounded-xl bg-secondary p-3 text-sm font-semibold", tendered && change < 0 && "text-destructive")}>
                        <span>{tendered && change < 0 ? "Still owed" : "Change due"}</span>
                        <span>{tendered ? fmt(Math.abs(change)) : "—"}</span>
                      </div>
                    </div>
                  )}

                  {method === "gift" && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Gift card code</Label>
                      <div className="flex gap-2">
                        <Input className="rounded-xl border-0 bg-secondary uppercase" placeholder="e.g. GIFT50" value={giftCode} onChange={(e) => setGiftCode(e.target.value)} />
                        <Button variant="outline" className="rounded-xl" onClick={() => {
                          const bal = GIFT_CARDS[giftCode.trim().toUpperCase()]
                          setGiftLeft(bal ?? null)
                          setError(bal === undefined ? "Gift card not found." : "")
                        }}>Check</Button>
                      </div>
                      {giftLeft !== null && <p className="text-sm text-emerald-600">Balance: {fmt(giftLeft)}</p>}
                    </div>
                  )}

                  {method === "mobile" && <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Ask the guest to tap or scan on the terminal, then confirm below.</p>}

                  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

                  <Button className="h-12 w-full gap-2 rounded-xl text-sm font-semibold" disabled={processing || !current || amountMismatch} onClick={pay}>
                    {processing ? <Spinner /> : <IconCreditCard className="h-4 w-4" />}
                    {processing ? "Processing…" : current ? `Pay ${fmt(current.cents)}${parts.length > 1 ? ` · ${current.label}` : ""}` : "Nothing to pay"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
