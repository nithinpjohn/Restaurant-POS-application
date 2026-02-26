"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PosHeader } from "@/components/pos-header"
import { cn } from "@/lib/utils"

const initialOrders = [
  { id: "ORD-001", table: "Table 5", items: 4, total: "$42.50", status: "Preparing", time: "10:30 AM", date: "Today", details: [{ name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Margherita Pizza", quantity: 1, price: "$14.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }, { name: "Tiramisu", quantity: 1, price: "$7.99" }] },
  { id: "ORD-002", table: "Table 3", items: 2, total: "$18.20", status: "Ready", time: "10:45 AM", date: "Today", details: [{ name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Chicken Alfredo", quantity: 1, price: "$16.99" }] },
  { id: "ORD-003", table: "Table 7", items: 6, total: "$65.75", status: "Preparing", time: "11:00 AM", date: "Today", details: [{ name: "Garlic Bread", quantity: 2, price: "$9.98" }, { name: "Grilled Salmon", quantity: 1, price: "$18.99" }, { name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Cheesecake", quantity: 1, price: "$6.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }] },
  { id: "ORD-004", table: "Table 2", items: 3, total: "$32.40", status: "Completed", time: "10:15 AM", date: "Today", details: [{ name: "Margherita Pizza", quantity: 1, price: "$14.99" }, { name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }] },
  { id: "ORD-005", table: "Table 9", items: 5, total: "$54.30", status: "Preparing", time: "11:15 AM", date: "Today", details: [{ name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Grilled Salmon", quantity: 1, price: "$18.99" }, { name: "Chocolate Cake", quantity: 1, price: "$6.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }] },
  { id: "ORD-006", table: "Table 6", items: 3, total: "$36.80", status: "Served", time: "11:20 AM", date: "Today", details: [{ name: "Margherita Pizza", quantity: 1, price: "$14.99" }, { name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Tiramisu", quantity: 1, price: "$7.99" }, { name: "Iced Tea", quantity: 1, price: "$2.99" }] },
  { id: "ORD-007", table: "Table 12", items: 4, total: "$48.25", status: "Preparing", time: "11:30 AM", date: "Today", details: [{ name: "Chicken Alfredo", quantity: 1, price: "$16.99" }, { name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Cheesecake", quantity: 1, price: "$6.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }] },
  { id: "ORD-008", table: "Table 1", items: 2, total: "$22.50", status: "Ready", time: "11:35 AM", date: "Today", details: [{ name: "Margherita Pizza", quantity: 1, price: "$14.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }] },
  { id: "ORD-009", table: "Table 8", items: 5, total: "$58.90", status: "Completed", time: "10:30 AM", date: "Yesterday", details: [{ name: "Grilled Salmon", quantity: 1, price: "$18.99" }, { name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Chocolate Cake", quantity: 1, price: "$6.99" }, { name: "Iced Tea", quantity: 3, price: "$8.97" }] },
  { id: "ORD-010", table: "Table 4", items: 2, total: "$24.75", status: "Completed", time: "10:45 AM", date: "Yesterday", details: [{ name: "Chicken Alfredo", quantity: 1, price: "$16.99" }, { name: "Iced Tea", quantity: 1, price: "$2.99" }, { name: "Tiramisu", quantity: 1, price: "$7.99" }] },
]

const tabs = ["Active", "Completed", "All"]

export default function OrdersPage() {
  const { toast } = useToast()
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

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null)
    toast({ title: `Order ${orderId} Updated`, description: `Status changed to ${newStatus}` })
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "Ready": return "bg-emerald-100 text-emerald-700"
      case "Preparing": return "bg-amber-100 text-amber-700"
      case "Served": return "bg-blue-100 text-blue-700"
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
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-10 bg-secondary border-0 rounded-xl text-sm"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild className="rounded-xl gap-2">
              <Link href="/new-order">
                <Plus className="h-4 w-4" />
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
                  {order.status === "Preparing" && (
                    <Button size="sm" className="rounded-full text-xs h-8" onClick={() => updateOrderStatus(order.id, "Ready")}>
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === "Ready" && (
                    <Button size="sm" className="rounded-full text-xs h-8" onClick={() => updateOrderStatus(order.id, "Served")}>
                      Mark as Served
                    </Button>
                  )}
                  {order.status === "Served" && (
                    <Button size="sm" className="rounded-full text-xs h-8" onClick={() => updateOrderStatus(order.id, "Completed")}>
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
    </div>
  )
}
