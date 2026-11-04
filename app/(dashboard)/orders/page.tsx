"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconSearch, IconPlus } from "@tabler/icons-react"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { PosHeader } from "@/components/layout/pos-header"
import { cn } from "@/lib/utils"
import { delay } from "@/lib/mock"
import { useApproval } from "@/components/auth/approval-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { parseMoney, fmt } from "@/lib/money"
import { useAudit } from "@/components/audit/audit-provider"
import { Spinner } from "@/components/ui/spinner"
import { initialOrders } from "@/lib/data/orders"


const tabs = ["Active", "Completed", "All"]

export default function OrdersPage() {
  const { toast, notify } = useNotifications()
  const { requestApproval } = useApproval()
  const { log } = useAudit()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<typeof initialOrders[0] | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState("Active")

  const activeOrders = orders.filter((o) => ["Preparing", "Ready", "Served"].includes(o.status))
  const completedOrders = orders.filter((o) => o.status === "Completed")
  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const displayOrders = activeTab === "Active" ? activeOrders : activeTab === "Completed" ? completedOrders : filteredOrders

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Void / refund (both need manager approval)
  type Order = typeof initialOrders[0]
  const [action, setAction] = useState<{ kind: "void" | "refund"; order: Order } | null>(null)
  const [reason, setReason] = useState("")
  const [refundAmt, setRefundAmt] = useState("")
  const [acting, setActing] = useState(false)

  const openAction = async (kind: "void" | "refund", order: Order) => {
    const perm = kind === "void" ? "order.void" : "payment.refund"
    if (!(await requestApproval({ perm, reason: `${kind === "void" ? "Void" : "Refund"} ${order.id}` }))) return
    setReason(""); setRefundAmt((parseMoney(order.total) / 100).toFixed(2)); setAction({ kind, order })
  }

  const confirmAction = async () => {
    if (!action) return
    const { kind, order } = action
    const cents = parseMoney(refundAmt)
    if (kind === "refund" && (cents <= 0 || cents > parseMoney(order.total))) return toast({ title: "Invalid refund amount", description: `Enter an amount up to ${order.total}.`, variant: "destructive" })
    setActing(true)
    await delay(800)
    setActing(false)
    const full = kind === "void" || cents === parseMoney(order.total)
    if (full) setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: kind === "void" ? "Voided" : "Refunded" } : o)))
    log({ category: kind === "void" ? "Order" : "Payment", action: kind === "void" ? `Order ${order.id} voided` : `Refund issued (${order.id})`, detail: `${reason}${kind === "refund" ? ` · ${fmt(cents)}${full ? "" : " (partial)"}` : ""}`, flagged: true })
    notify({ title: kind === "void" ? `Order ${order.id} voided` : `Refunded ${fmt(cents)}`, description: reason, type: "warning" })
    setAction(null)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (updatingId) return
    setUpdatingId(orderId)
    await delay(600)
    setUpdatingId(null)
    log({ category: "Order", action: `Order ${orderId} marked ${newStatus}` })
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null)
    toast({ title: `Order ${orderId} Updated`, description: `Status changed to ${newStatus}` })
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "Ready": return "bg-emerald-100 text-emerald-700"
      case "Preparing": return "bg-amber-100 text-amber-700"
      case "Served": return "bg-blue-100 text-blue-700"
      case "Voided": return "bg-red-100 text-red-700"
      case "Refunded": return "bg-purple-100 text-purple-700"
      default: return "bg-secondary text-muted-foreground"
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Order Management</h1>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-10 bg-secondary border-0 rounded-xl text-sm"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild className="rounded-xl gap-2">
              <Link href="/new-order">
                <IconPlus className="h-4 w-4" />
                New Order
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                activeTab === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-secondary"
              )}
            >
              {tab} Orders
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {displayOrders.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              No orders to display.
            </div>
          ) : (
            displayOrders.map((order) => (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{order.id}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.table} - {order.time} - {order.date}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.items} items - {order.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true) }}>
                    View Details
                  </Button>
                  {["Preparing", "Ready", "Served"].includes(order.status) && (
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => openAction("void", order)}>Void</Button>
                  )}
                  {order.status === "Completed" && (
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => openAction("refund", order)}>Refund</Button>
                  )}
                  {order.status === "Preparing" && (
                    <Button size="sm" className="rounded-full text-xs h-8" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, "Ready")}>{updatingId === order.id && <Spinner />}
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === "Ready" && (
                    <Button size="sm" className="rounded-full text-xs h-8" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, "Served")}>{updatingId === order.id && <Spinner />}
                      Mark as Served
                    </Button>
                  )}
                  {order.status === "Served" && (
                    <Button size="sm" className="rounded-full text-xs h-8" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, "Completed")}>{updatingId === order.id && <Spinner />}
                      Complete Order
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Table</p>
                  <p className="text-sm font-medium text-foreground">{selectedOrder.table}</p>
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium text-foreground">{selectedOrder.time}</p>
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium text-foreground">{selectedOrder.date}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Order Items</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-secondary text-xs font-medium text-muted-foreground">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-4 text-right">Price</div>
                  </div>
                  {selectedOrder.details.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 p-3 border-t border-border text-sm">
                      <div className="col-span-6 text-foreground">{item.name}</div>
                      <div className="col-span-2 text-center text-muted-foreground">{item.quantity}</div>
                      <div className="col-span-4 text-right text-foreground">{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">{selectedOrder.total}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                {selectedOrder.status === "Preparing" && (
                  <Button className="flex-1 rounded-xl" onClick={() => { updateOrderStatus(selectedOrder.id, "Ready"); setIsDetailsOpen(false) }}>
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.status === "Ready" && (
                  <Button className="flex-1 rounded-xl" onClick={() => { updateOrderStatus(selectedOrder.id, "Served"); setIsDetailsOpen(false) }}>
                    Mark as Served
                  </Button>
                )}
                {selectedOrder.status === "Served" && (
                  <Button className="flex-1 rounded-xl" onClick={() => { updateOrderStatus(selectedOrder.id, "Completed"); setIsDetailsOpen(false) }}>
                    Complete Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!action} onOpenChange={(o) => !o && !acting && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.kind === "void" ? "Void order" : "Refund order"} {action?.order.id}</DialogTitle>
            <DialogDescription>
              {action?.kind === "void" ? "The order is cancelled and cannot be reopened." : "The refund is returned to the original payment method."} This is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {action?.kind === "refund" && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Refund amount (max {action.order.total})</p>
                <Input className="rounded-xl border-0 bg-secondary" type="number" min="0" step="0.01" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} />
              </div>
            )}
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Reason</p>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="rounded-xl border-0 bg-secondary"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  {(action?.kind === "void" ? ["Guest left", "Wrong order entered", "Kitchen error", "Duplicate order"] : ["Food quality", "Wrong item served", "Overcharged", "Guest complaint"]).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" disabled={acting} onClick={() => setAction(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" disabled={!reason || acting} onClick={confirmAction}>{acting && <Spinner />}{action?.kind === "void" ? "Void order" : "Issue refund"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
