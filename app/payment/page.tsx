"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, CheckCircle } from "lucide-react"
import { PosHeader } from "@/components/pos-header"
import { cn } from "@/lib/utils"

const tipOptions = [
  { label: "15%", value: 0.15 },
  { label: "18%", value: 0.18 },
  { label: "20%", value: 0.20 },
]

export default function PaymentPage() {
  const [selectedTip, setSelectedTip] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState("")
  const [isPaid, setIsPaid] = useState(false)

  const subtotal = 38.50
  const tax = subtotal * 0.08
  const tipAmount = selectedTip !== null ? subtotal * selectedTip : parseFloat(customTip) || 0
  const total = subtotal + tax + tipAmount

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-foreground mb-6">Process Payment</h1>

        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
          {/* Order Details */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Order Details</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Select Order</Label>
                <Select>
                  <SelectTrigger className="mt-1 rounded-xl bg-secondary border-0">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ord-001">ORD-001 (Table 5)</SelectItem>
                    <SelectItem value="ord-002">ORD-002 (Table 3)</SelectItem>
                    <SelectItem value="ord-003">ORD-003 (Table 7)</SelectItem>
                    <SelectItem value="ord-004">ORD-004 (Table 2)</SelectItem>
                    <SelectItem value="ord-005">ORD-005 (Table 9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
                <h4 className="font-medium text-foreground">Order Summary</h4>
                <div className="flex justify-between"><span className="text-muted-foreground">Table</span><span className="text-foreground">Table 5</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="text-foreground">4 items</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span className="text-foreground">${tax.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><span className="text-foreground">${tipAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Payment Method</Label>
                <Select defaultValue="credit-card">
                  <SelectTrigger className="mt-1 rounded-xl bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="gift-card">Gift Card</SelectItem>
                    <SelectItem value="mobile-payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Tip Amount</Label>
                <div className="flex gap-2">
                  {tipOptions.map((tip) => (
                    <button
                      key={tip.label}
                      onClick={() => { setSelectedTip(tip.value); setCustomTip("") }}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-xl border transition-colors",
                        selectedTip === tip.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {tip.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedTip(null)}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-xl border transition-colors",
                      selectedTip === null && customTip
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-secondary"
                    )}
                  >
                    Custom
                  </button>
                </div>
                {selectedTip === null && (
                  <Input
                    className="mt-2 rounded-xl bg-secondary border-0"
                    placeholder="Custom tip amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                  />
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Card Number</Label>
                <Input className="mt-1 rounded-xl bg-secondary border-0" placeholder="XXXX XXXX XXXX XXXX" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                  <Input className="mt-1 rounded-xl bg-secondary border-0" placeholder="MM/YY" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CVV</Label>
                  <Input className="mt-1 rounded-xl bg-secondary border-0" placeholder="XXX" />
                </div>
              </div>

              <Button className="w-full h-12 rounded-xl gap-2 text-sm font-semibold" onClick={() => setIsPaid(true)}>
                <CreditCard className="h-4 w-4" />
                Process Payment - ${total.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>

        {isPaid && (
          <div className="mt-6 max-w-4xl bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-medium text-emerald-900">Payment Successful</h3>
              <p className="text-sm text-emerald-700">Receipt #12345 has been sent to the customer.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
