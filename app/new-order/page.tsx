"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus, Trash2, Info } from "lucide-react"
import { PosHeader } from "@/components/pos-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const menuItems = [
  { id: 1, name: "Caesar Salad", category: "Appetizer", price: 8.99, originalPrice: 11.5, discount: 15, available: 12, image: "/images/caesar-salad.jpg" },
  { id: 2, name: "Margherita Pizza", category: "Main Course", price: 14.99, originalPrice: null, discount: 0, available: 21, image: "/images/margherita-pizza.jpg" },
  { id: 3, name: "Chocolate Cake", category: "Dessert", price: 6.99, originalPrice: 8.0, discount: 15, available: 10, image: "/images/chocolate-cake.jpg" },
  { id: 4, name: "Garlic Bread", category: "Appetizer", price: 4.99, originalPrice: null, discount: 0, available: 19, image: "/images/garlic-bread.jpg" },
  { id: 5, name: "Grilled Salmon", category: "Main Course", price: 18.99, originalPrice: 20.0, discount: 15, available: 5, image: "/images/grilled-salmon.jpg" },
  { id: 6, name: "Tiramisu", category: "Dessert", price: 7.99, originalPrice: null, discount: 0, available: 56, image: "/images/tiramisu.jpg" },
  { id: 7, name: "Iced Tea", category: "Beverages", price: 2.99, originalPrice: null, discount: 0, available: 16, image: "/images/iced-tea.jpg" },
  { id: 8, name: "Chicken Alfredo", category: "Main Course", price: 16.99, originalPrice: null, discount: 0, available: 18, image: "/images/chicken-alfredo.jpg" },
  { id: 9, name: "Cheesecake", category: "Dessert", price: 6.99, originalPrice: null, discount: 0, available: 8, image: "/images/cheesecake.jpg" },
]

const categories = ["All", "Main Course", "Appetizer", "Dessert", "Beverages"]

export default function NewOrderPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Array<{ id: number; name: string; price: number; quantity: number; image: string }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [customerName, setCustomerName] = useState("Walk-in Customer")
  const [personCount, setPersonCount] = useState(2)
  const [isOrderPlaced, setIsOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")

  // Countdown timer for specials
  const [countdown, setCountdown] = useState({ hours: 12, minutes: 10, seconds: 9 })
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1
        if (totalSeconds <= 0) return { hours: 0, minutes: 0, seconds: 0 }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const addToCart = (item: typeof menuItems[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image }]
    })
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    )
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((c) => c.id !== id))
  }

  const getCartQuantity = (id: number) => {
    const item = cart.find((c) => c.id === id)
    return item ? item.quantity : 0
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "All" || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const discountItems = menuItems.filter((item) => item.discount > 0)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountTotal = cart.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.id)
    if (menuItem && menuItem.originalPrice) {
      return sum + (menuItem.originalPrice - menuItem.price) * item.quantity
    }
    return sum
  }, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handlePlaceOrder = () => {
    const newOrderNumber = `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`
    setOrderNumber(newOrderNumber)
    setIsOrderPlaced(true)
  }

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader
        searchPlaceholder="Find food or beverages"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="flex flex-1">
        {/* Left: Menu Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Special Discount Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Special Discount Today</h2>
              <span className="text-sm text-destructive font-medium">
                Ends in{" "}
                <span className="font-bold">
                  {pad(countdown.hours)} : {pad(countdown.minutes)} : {pad(countdown.seconds)}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {discountItems.map((item) => {
                const qty = getCartQuantity(item.id)
                return (
                  <div key={item.id} className="bg-card rounded-2xl p-3 border border-border">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-secondary">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                      <span className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm text-xs px-2 py-1 rounded-lg text-muted-foreground">
                        Available: {item.available}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-foreground">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                        {item.discount}%
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        ${item.originalPrice?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-foreground">${item.price.toFixed(2)}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-full px-4" onClick={() => addToCart(item)}>
                          Order
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Explore Menu Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Explore Our Best Menu</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">View All</button>
            </div>
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-secondary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const qty = getCartQuantity(item.id)
                return (
                  <div key={item.id} className="bg-card rounded-2xl p-3 border border-border">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-secondary">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                      <span className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm text-xs px-2 py-1 rounded-lg text-muted-foreground">
                        Available: {item.available}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Price per portion</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-foreground">${item.price.toFixed(2)}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-full px-4" onClick={() => addToCart(item)}>
                          Order
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </main>

        {/* Right Sidebar: Order Panel */}
        <aside className="w-[360px] border-l border-border bg-card flex flex-col shrink-0 hidden lg:flex">
          {/* Customer Information */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Customer Information</h3>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Customer name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-secondary border-0 rounded-xl text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Number of person</Label>
                <div className="flex items-center gap-3 bg-secondary rounded-xl px-3 py-2">
                  <span className="flex-1 text-sm text-foreground">{personCount} Person Table</span>
                  <button
                    onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                    className="h-7 w-7 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{personCount}</span>
                  <button
                    onClick={() => setPersonCount(personCount + 1)}
                    className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Order */}
          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="font-semibold text-foreground mb-4">Current Order</h3>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No items added yet. Select items from the menu.
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                      <p className="text-sm font-semibold" style={{ color: "hsl(var(--success))" }}>
                        ${(item.price * item.quantity).toFixed(2)}{" "}
                        <span className="text-xs text-muted-foreground font-normal">x{item.quantity}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-border">
              <h3 className="font-semibold text-foreground mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount sales</span>
                    <span className="text-destructive">-${discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total tax</span>
                  <span className="text-foreground">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span style={{ color: "hsl(var(--success))" }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                className="w-full mt-4 h-12 rounded-xl text-sm font-semibold"
                onClick={handlePlaceOrder}
              >
                Order Now
              </Button>
            </div>
          )}
        </aside>
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={isOrderPlaced} onOpenChange={setIsOrderPlaced}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Placed Successfully</DialogTitle>
            <DialogDescription>Your order has been sent to the kitchen.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-xl border border-border p-6 bg-secondary/50 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Order #{orderNumber}</h3>
              <p className="text-sm text-muted-foreground mt-1">{customerName} - {personCount} Person Table</p>
              <p className="font-semibold text-foreground mt-2">${total.toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1 rounded-xl"
              onClick={() => {
                setCart([])
                setIsOrderPlaced(false)
              }}
            >
              New Order
            </Button>
            <Button className="sm:flex-1 rounded-xl" onClick={() => router.push("/orders")}>
              View All Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
