"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Users, Clock, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PosHeader } from "@/components/pos-header"
import { cn } from "@/lib/utils"

const initialTables = [
  { id: 1, number: 1, status: "occupied", seats: 4, time: "45 min", server: "John", order: "ORD-001" },
  { id: 2, number: 2, status: "occupied", seats: 2, time: "30 min", server: "Sarah", order: "ORD-004" },
  { id: 3, number: 3, status: "occupied", seats: 6, time: "15 min", server: "Mike", order: "ORD-002" },
  { id: 4, number: 4, status: "available", seats: 4, time: "-", server: "-", order: "-" },
  { id: 5, number: 5, status: "occupied", seats: 2, time: "60 min", server: "Lisa", order: "ORD-001" },
  { id: 6, number: 6, status: "occupied", seats: 8, time: "20 min", server: "David", order: "ORD-005" },
  { id: 7, number: 7, status: "occupied", seats: 4, time: "50 min", server: "John", order: "ORD-003" },
  { id: 8, number: 8, status: "available", seats: 2, time: "-", server: "-", order: "-" },
  { id: 9, number: 9, status: "occupied", seats: 6, time: "10 min", server: "Sarah", order: "ORD-005" },
  { id: 10, number: 10, status: "available", seats: 4, time: "-", server: "-", order: "-" },
  { id: 11, number: 11, status: "available", seats: 2, time: "-", server: "-", order: "-" },
  { id: 12, number: 12, status: "occupied", seats: 4, time: "35 min", server: "Mike", order: "ORD-003" },
]

const sampleOrders: Record<string, { id: string; items: { name: string; quantity: number; price: string }[]; total: string; status: string }> = {
  "ORD-001": { id: "ORD-001", items: [{ name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Margherita Pizza", quantity: 1, price: "$14.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }, { name: "Tiramisu", quantity: 1, price: "$7.99" }], total: "$42.50", status: "Preparing" },
  "ORD-002": { id: "ORD-002", items: [{ name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Chicken Alfredo", quantity: 1, price: "$16.99" }], total: "$18.20", status: "Ready" },
  "ORD-003": { id: "ORD-003", items: [{ name: "Garlic Bread", quantity: 2, price: "$9.98" }, { name: "Grilled Salmon", quantity: 1, price: "$18.99" }, { name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Cheesecake", quantity: 1, price: "$6.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }], total: "$65.75", status: "Preparing" },
  "ORD-004": { id: "ORD-004", items: [{ name: "Margherita Pizza", quantity: 1, price: "$14.99" }, { name: "Caesar Salad", quantity: 1, price: "$8.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }], total: "$32.40", status: "Served" },
  "ORD-005": { id: "ORD-005", items: [{ name: "Garlic Bread", quantity: 1, price: "$4.99" }, { name: "Grilled Salmon", quantity: 1, price: "$18.99" }, { name: "Chocolate Cake", quantity: 1, price: "$6.99" }, { name: "Iced Tea", quantity: 2, price: "$5.98" }], total: "$54.30", status: "Preparing" },
}

export default function TablesPage() {
  const { toast } = useToast()
  const [tables, setTables] = useState(initialTables)
  const [isAddTableOpen, setIsAddTableOpen] = useState(false)
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false)
  const [isSeatGuestsOpen, setIsSeatGuestsOpen] = useState(false)
  const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<typeof initialTables[0] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<typeof sampleOrders["ORD-001"] | null>(null)
  const [tableToDelete, setTableToDelete] = useState<typeof initialTables[0] | null>(null)
  const [newTableData, setNewTableData] = useState({ number: "", seats: "" })
  const [guestInfo, setGuestInfo] = useState({ guests: "", server: "" })

  const handleAddTableClick = () => {
    const highestNumber = Math.max(...tables.map((t) => t.number), 0)
    setNewTableData({ number: String(highestNumber + 1), seats: "4" })
    setIsAddTableOpen(true)
  }

  const handleAddTable = () => {
    const num = parseInt(newTableData.number)
    const seats = parseInt(newTableData.seats)
    if (isNaN(num) || num <= 0) { toast({ title: "Invalid Table Number", variant: "destructive" }); return }
    if (isNaN(seats) || seats <= 0) { toast({ title: "Invalid Seats", variant: "destructive" }); return }
    if (tables.some((t) => t.number === num)) { toast({ title: `Table ${num} already exists`, variant: "destructive" }); return }
    setTables([...tables, { id: Math.max(...tables.map((t) => t.id), 0) + 1, number: num, status: "available", seats, time: "-", server: "-", order: "-" }])
    setIsAddTableOpen(false)
    toast({ title: "Table Added", description: `Table ${num} has been added.` })
  }

  const handleViewOrder = (table: typeof initialTables[0]) => {
    if (table.order !== "-") { setSelectedTable(table); setSelectedOrder(sampleOrders[table.order]); setIsViewOrderOpen(true) }
    else toast({ title: "No Order", description: `Table ${table.number} doesn't have an active order.`, variant: "destructive" })
  }

  const handleClearTable = (table: typeof initialTables[0]) => {
    setTables(tables.map((t) => (t.id === table.id ? { ...t, status: "available", time: "-", server: "-", order: "-" } : t)))
    toast({ title: "Table Cleared", description: `Table ${table.number} is now available.` })
  }

  const handleSeatGuestsClick = (table: typeof initialTables[0]) => { setSelectedTable(table); setGuestInfo({ guests: "", server: "" }); setIsSeatGuestsOpen(true) }

  const handleSeatGuests = () => {
    const guests = parseInt(guestInfo.guests)
    if (isNaN(guests) || guests <= 0) { toast({ title: "Invalid guest count", variant: "destructive" }); return }
    if (!guestInfo.server.trim()) { toast({ title: "Server required", variant: "destructive" }); return }
    setTables(tables.map((t) => (t.id === selectedTable?.id ? { ...t, status: "occupied", time: "0 min", server: guestInfo.server, order: "-" } : t)))
    setIsSeatGuestsOpen(false)
    toast({ title: "Guests Seated", description: `${guests} guests at Table ${selectedTable?.number}.` })
  }

  const handleDeleteTableClick = (table: typeof initialTables[0]) => {
    if (table.status === "occupied") { toast({ title: "Cannot delete occupied table", variant: "destructive" }); return }
    setTableToDelete(table); setIsDeleteTableOpen(true)
  }

  const handleDeleteTable = () => {
    if (tableToDelete) { setTables(tables.filter((t) => t.id !== tableToDelete.id)); setIsDeleteTableOpen(false); toast({ title: "Table Deleted" }) }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Table Management</h1>
          <Button className="rounded-xl gap-2" onClick={handleAddTableClick}>
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={cn(
                "bg-card border rounded-2xl p-4 relative",
                table.status === "occupied" ? "border-destructive/30" : "border-emerald-300"
              )}
            >
              <button
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => handleDeleteTableClick(table)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold",
                  table.status === "occupied" ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"
                )}>
                  {table.number}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground">Table {table.number}</h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    table.status === "occupied" ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {table.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-2"><Users className="h-3 w-3" /> {table.seats} seats</div>
                <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {table.time}</div>
                <div className="flex items-center gap-2"><UserCircle className="h-3 w-3" /> {table.server}</div>
              </div>

              {table.status === "occupied" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => handleViewOrder(table)}>
                    View Order
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => handleClearTable(table)}>
                    Clear
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="w-full rounded-full text-xs h-8" onClick={() => handleSeatGuestsClick(table)}>
                  Seat Guests
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Add Table Dialog */}
      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>Enter the details for the new table.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-number" className="text-right text-sm">Number</Label>
              <Input id="table-number" type="number" min="1" value={newTableData.number} onChange={(e) => setNewTableData({ ...newTableData, number: e.target.value })} className="col-span-3 rounded-xl bg-secondary border-0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seats" className="text-right text-sm">Seats</Label>
              <Input id="seats" type="number" min="1" value={newTableData.seats} onChange={(e) => setNewTableData({ ...newTableData, seats: e.target.value })} className="col-span-3 rounded-xl bg-secondary border-0" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddTableOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleAddTable}>Add Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
            <DialogDescription>Table {selectedTable?.number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 bg-secondary text-xs font-medium text-muted-foreground">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Price</div>
                </div>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 p-3 border-t border-border text-sm">
                    <div className="col-span-6 text-foreground">{item.name}</div>
                    <div className="col-span-2 text-center text-muted-foreground">{item.quantity}</div>
                    <div className="col-span-4 text-right text-foreground">{item.price}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">{selectedOrder.total}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsViewOrderOpen(false)}>Close</Button>
                <Button asChild className="flex-1 rounded-xl"><Link href="/orders">Go to Orders</Link></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Seat Guests Dialog */}
      <Dialog open={isSeatGuestsOpen} onOpenChange={setIsSeatGuestsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seat Guests</DialogTitle>
            <DialogDescription>Enter guest information for Table {selectedTable?.number}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guests" className="text-right text-sm">Guests</Label>
              <Input id="guests" type="number" min="1" max={selectedTable?.seats || 10} value={guestInfo.guests} onChange={(e) => setGuestInfo({ ...guestInfo, guests: e.target.value })} className="col-span-3 rounded-xl bg-secondary border-0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="server" className="text-right text-sm">Server</Label>
              <Input id="server" value={guestInfo.server} onChange={(e) => setGuestInfo({ ...guestInfo, server: e.target.value })} className="col-span-3 rounded-xl bg-secondary border-0" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsSeatGuestsOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleSeatGuests}>Seat Guests</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <Dialog open={isDeleteTableOpen} onOpenChange={setIsDeleteTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>Are you sure you want to delete Table {tableToDelete?.number}?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDeleteTableOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDeleteTable}>Delete Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
