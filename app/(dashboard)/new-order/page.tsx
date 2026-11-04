"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconMinus, IconPlus, IconTrash, IconInfoCircle, IconNote, IconPlayerPause, IconPlayerPlay, IconX } from "@tabler/icons-react"
import { toast as sonner } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COUPONS, discountFor, type Coupon } from "@/lib/coupons"
import { PosHeader } from "@/components/layout/pos-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import { delay } from "@/lib/mock"
import { ageOf, MIN_AGE } from "@/lib/age"
import { PageSearch } from "@/components/layout/page-search"
import { AllergenBadges } from "@/components/menu/allergen-badges"
import { useAudit } from "@/components/audit/audit-provider"
import { initialMenuItems } from "@/lib/data/menu"
import { ALLERGENS, conflicts } from "@/lib/allergens"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Spinner } from "@/components/ui/spinner"
import { useNotifications } from "@/components/notifications/notifications-provider"

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
  { id: 10, name: "Craft Beer", category: "Beverages", price: 6.5, originalPrice: null, discount: 0, available: 24, image: "/placeholder.jpg" },
  { id: 11, name: "House Red Wine", category: "Beverages", price: 8.5, originalPrice: null, discount: 0, available: 18, image: "/placeholder.jpg" },
]

const allergensByName = Object.fromEntries(initialMenuItems.map((i) => [i.name, i.allergens]))
const ageRestricted = new Set(initialMenuItems.filter((i) => i.ageRestricted).map((i) => i.name))
const allergensOf = (name: string): string[] => allergensByName[name] ?? []

type CartLine = { id: number; name: string; price: number; quantity: number; image: string; mods?: string[]; notes?: string }
type HeldOrder = { id: string; label: string; personCount: number; cart: CartLine[]; guestAllergies: string[]; coupon: Coupon | null; at: number }

const MODIFIERS = ["No onions", "Extra cheese", "Spicy", "Less salt", "Gluten-free", "On the side"]
const HELD_KEY = "kans-resto-held-orders"

const categories = ["All", "Main Course", "Appetizer", "Dessert", "Beverages"]

export default function NewOrderPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartLine[]>([])
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

  const { log } = useAudit()
  const [guestAllergies, setGuestAllergies] = useState<string[]>([])
  const [pending, setPending] = useState<{ item: typeof menuItems[0]; hit: string[] } | null>(null)
  const [overrideCount, setOverrideCount] = useState(0)

  const toggleGuestAllergy = (a: string) =>
    setGuestAllergies((g) => (g.includes(a) ? g.filter((x) => x !== a) : [...g, a]))

  // Ask before adding a dish that contains something the guest is allergic to.
  // Alcohol needs a one-time age check per order.
  const [ageVerified, setAgeVerified] = useState(false)
  const [ageGate, setAgeGate] = useState<{ item: typeof menuItems[0] | null } | null>(null)
  const [dob, setDob] = useState("")
  const [ageError, setAgeError] = useState("")

  const addToCart = (item: typeof menuItems[0]) => {
    if (ageRestricted.has(item.name) && !ageVerified) { setDob(""); setAgeError(""); setAgeGate({ item }) }
    else addWithAllergenCheck(item)
  }

  const confirmAge = () => {
    if (!ageGate) return
    if (ageOf(dob) < MIN_AGE) {
      setAgeError(`Guest must be ${MIN_AGE} or older to be served alcohol.`)
      log({ category: "Order", action: "Age check failed", detail: `${customerName} · ${ageGate.item?.name ?? "order with alcohol"} not served`, flagged: true })
      return
    }
    setAgeVerified(true)
    log({ category: "Order", action: "Age check passed", detail: `${customerName} verified ${MIN_AGE}+ (date of birth not stored)` })
    const gate = ageGate
    setAgeGate(null)
    if (gate.item) addWithAllergenCheck(gate.item)
    else handlePlaceOrder(true)
  }

  const addWithAllergenCheck = (item: typeof menuItems[0]) => {
    const hit = conflicts(allergensOf(item.name), guestAllergies)
    if (hit.length) setPending({ item, hit })
    else commitAdd(item)
  }

  const confirmOverride = () => {
    if (!pending) return
    commitAdd(pending.item)
    setOverrideCount((c) => c + 1)
    log({ category: "Allergen", action: "Allergen warning overridden", detail: `${pending.item.name} added for ${customerName}; guest declared: ${pending.hit.join(", ")}`, flagged: true })
    notify({ title: "Allergen warning overridden", description: `${pending.item.name} contains ${pending.hit.join(", ")}.`, type: "warning" })
    setPending(null)
  }

  const cartConflicts = cart
    .map((c) => ({ name: c.name, hit: conflicts(allergensOf(c.name), guestAllergies) }))
    .filter((c) => c.hit.length)

  const commitAdd = (item: typeof menuItems[0]) => {
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
    const idx = cart.findIndex((c) => c.id === id)
    const line = cart[idx]
    if (!line) return
    setCart((prev) => prev.filter((c) => c.id !== id))
    sonner(`${line.name} removed`, {
      action: {
        label: "Undo",
        onClick: () => setCart((prev) => (prev.some((c) => c.id === line.id) ? prev : [...prev.slice(0, idx), line, ...prev.slice(idx)])),
      },
    })
  }

  const updateLine = (id: number, patch: Partial<CartLine>) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const toggleMod = (id: number, mod: string) =>
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mods: c.mods?.includes(mod) ? c.mods.filter((m) => m !== mod) : [...(c.mods ?? []), mod] } : c)),
    )

  // Coupons
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponInput, setCouponInput] = useState("")
  const [couponError, setCouponError] = useState("")

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    const def = COUPONS[code]
    if (!def) return setCouponError("Invalid coupon code")
    if (subtotal < def.min) return setCouponError(`Needs a minimum of $${def.min.toFixed(2)}`)
    setCoupon({ code, ...def })
    setCouponInput("")
    setCouponError("")
    log({ category: "Order", action: "Coupon applied", detail: `${code} (${def.label})` })
    notify({ title: `Coupon ${code} applied`, description: def.label, persist: false })
  }

  // Held (parked) orders, kept in this browser.
  const [held, setHeld] = useState<HeldOrder[]>([])
  const [heldOpen, setHeldOpen] = useState(false)
  const [heldReady, setHeldReady] = useState(false)

  useEffect(() => {
    try { const raw = localStorage.getItem(HELD_KEY); if (raw) setHeld(JSON.parse(raw)) } catch {}
    setHeldReady(true)
  }, [])
  useEffect(() => {
    if (!heldReady) return
    try { localStorage.setItem(HELD_KEY, JSON.stringify(held)) } catch {}
  }, [held, heldReady])

  const snapshot = (): HeldOrder => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: customerName, personCount, cart, guestAllergies, coupon, at: Date.now(),
  })

  const holdOrder = () => {
    setHeld((h) => [snapshot(), ...h])
    log({ category: "Order", action: "Order held", detail: `${customerName} · ${cart.length} items · $${total.toFixed(2)}` })
    notify({ title: "Order held", description: `${customerName}'s order was parked.`, type: "info" })
    setCart([]); setCoupon(null); setGuestAllergies([]); setOverrideCount(0); setAgeVerified(false)
  }

  const resumeOrder = (o: HeldOrder) => {
    // Park whatever is on screen so nothing is lost.
    setHeld((h) => [...(cart.length ? [snapshot()] : []), ...h.filter((x) => x.id !== o.id)])
    setCart(o.cart); setCustomerName(o.label); setPersonCount(o.personCount)
    setGuestAllergies(o.guestAllergies); setCoupon(o.coupon); setOverrideCount(0); setAgeVerified(false)
    setHeldOpen(false)
    log({ category: "Order", action: "Held order resumed", detail: `${o.label} · ${o.cart.length} items` })
  }

  const discardHeld = (o: HeldOrder) => {
    setHeld((h) => h.filter((x) => x.id !== o.id))
    log({ category: "Order", action: "Held order discarded", detail: `${o.label} · ${o.cart.length} items`, flagged: true })
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
  const couponDiscount = discountFor(coupon, subtotal)
  const tax = (subtotal - couponDiscount) * 0.08
  const total = subtotal - couponDiscount + tax

  const { notify } = useNotifications()
  const [placing, setPlacing] = useState(false)

  const handlePlaceOrder = async (verified = ageVerified) => {
    if (!verified && cart.some((c) => ageRestricted.has(c.name))) { setDob(""); setAgeError(""); setAgeGate({ item: null }); return }
    setPlacing(true)
    await delay()
    const newOrderNumber = `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`
    setOrderNumber(newOrderNumber)
    setPlacing(false)
    setIsOrderPlaced(true)
    log({ category: "Order", action: `Order ${newOrderNumber} placed`, detail: `${customerName} · ${personCount} guests · $${total.toFixed(2)} · guest allergies: ${guestAllergies.join(", ") || "none"}${couponDiscount > 0 ? ` · coupon ${coupon?.code} -$${couponDiscount.toFixed(2)}` : ""}${cartConflicts.length ? ` · CONTAINS CONFLICTS: ${cartConflicts.map((c) => c.name).join(", ")}` : ""}`, flagged: cartConflicts.length > 0 || overrideCount > 0 })
    notify({ title: `Order ${newOrderNumber} placed`, description: `${customerName} · $${total.toFixed(2)}`, href: ROUTES.orders })
  }

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <div className="flex flex-1">
        {/* Left: Menu Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <PageSearch value={searchTerm} onChange={setSearchTerm} placeholder="Find food or beverages" className="mb-6" />

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
                    <h3 className="font-medium text-sm text-foreground">{item.name}{ageRestricted.has(item.name) && <span className="ml-1.5 rounded bg-foreground px-1 py-0.5 text-[10px] font-semibold text-background">18+</span>}</h3>
                    <AllergenBadges allergens={allergensOf(item.name)} highlight={guestAllergies} className="mt-1" />
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
                            <IconMinus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <IconPlus className="h-3 w-3" />
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
                    <h3 className="font-medium text-sm text-foreground">{item.name}{ageRestricted.has(item.name) && <span className="ml-1.5 rounded bg-foreground px-1 py-0.5 text-[10px] font-semibold text-background">18+</span>}</h3>
                    <AllergenBadges allergens={allergensOf(item.name)} highlight={guestAllergies} className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-0.5">Price per portion</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-foreground">${item.price.toFixed(2)}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            <IconMinus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <IconPlus className="h-3 w-3" />
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
              <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
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
                    <IconMinus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{personCount}</span>
                  <button
                    onClick={() => setPersonCount(personCount + 1)}
                    className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    <IconPlus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 pb-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <IconAlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Guest allergies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={guestAllergies.includes(a)}
                  onClick={() => toggleGuestAllergy(a)}
                  className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", guestAllergies.includes(a) ? "border-red-500 bg-red-100 text-red-700" : "border-border bg-card text-muted-foreground hover:bg-secondary")}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Current Order */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Current Order</h3>
              <Button variant="outline" size="sm" className="h-7 gap-1 rounded-full text-xs" onClick={() => setHeldOpen(true)}>
                <IconPlayerPause className="h-3 w-3" /> Held ({held.length})
              </Button>
            </div>
            {cartConflicts.length > 0 && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <p className="mb-1 flex items-center gap-1.5 font-semibold"><IconAlertTriangle className="h-4 w-4" /> Allergen conflict in this order</p>
                {cartConflicts.map((c) => <p key={c.name}>{c.name}: {c.hit.join(", ")}</p>)}
              </div>
            )}
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
                      {conflicts(allergensOf(item.name), guestAllergies).length > 0 && (
                        <AllergenBadges allergens={conflicts(allergensOf(item.name), guestAllergies)} highlight={guestAllergies} />
                      )}
                      <p className="text-sm font-semibold" style={{ color: "hsl(var(--success))" }}>
                        ${(item.price * item.quantity).toFixed(2)}{" "}
                        <span className="text-xs text-muted-foreground font-normal">x{item.quantity}</span>
                      </p>
                      {(item.mods?.length || item.notes) ? (
                        <p className="text-[11px] text-muted-foreground truncate">{[...(item.mods ?? []), item.notes].filter(Boolean).join(" · ")}</p>
                      ) : null}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                        >
                          <IconMinus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          <IconPlus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button aria-label={`Customize ${item.name}`} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                          <IconNote className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64 space-y-3 rounded-xl">
                        <p className="text-sm font-medium">Customize {item.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {MODIFIERS.map((m) => (
                            <button
                              key={m}
                              type="button"
                              aria-pressed={item.mods?.includes(m)}
                              onClick={() => toggleMod(item.id, m)}
                              className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", item.mods?.includes(m) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary")}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        <Input
                          className="h-9 rounded-xl border-0 bg-secondary text-sm"
                          placeholder="Note for the kitchen…"
                          value={item.notes ?? ""}
                          onChange={(e) => updateLine(item.id, { notes: e.target.value })}
                        />
                      </PopoverContent>
                    </Popover>
                    <button
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeFromCart(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <IconTrash className="h-4 w-4" />
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
              {coupon ? (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <span><strong>{coupon.code}</strong> · {coupon.label}{couponDiscount === 0 && " (minimum not met)"}</span>
                  <button aria-label="Remove coupon" onClick={() => setCoupon(null)}><IconX className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex gap-2">
                    <Input
                      className="h-9 rounded-xl border-0 bg-secondary text-sm uppercase"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError("") }}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    />
                    <Button variant="outline" className="h-9 rounded-xl" disabled={!couponInput.trim()} onClick={applyCoupon}>Apply</Button>
                  </div>
                  {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
                </div>
              )}
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
                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupon ({coupon?.code})</span>
                    <span className="text-destructive">-${couponDiscount.toFixed(2)}</span>
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
              <div className="mt-4 flex gap-2">
              <Button variant="outline" className="h-12 gap-1.5 rounded-xl" disabled={placing} onClick={holdOrder}>
                <IconPlayerPause className="h-4 w-4" /> Hold
              </Button>
              <Button
                className="h-12 flex-1 rounded-xl text-sm font-semibold"
                onClick={() => handlePlaceOrder()}
                disabled={placing}
              >
                {placing && <Spinner />}
                {placing ? "Placing order…" : "Order Now"}
              </Button>
              </div>
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
                setOverrideCount(0)
                setAgeVerified(false)
                setCoupon(null)
                setIsOrderPlaced(false)
              }}
            >
              New Order
            </Button>
            <Button className="sm:flex-1 rounded-xl" onClick={() => router.push(ROUTES.orders)}>
              View All Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Held orders</DialogTitle>
            <DialogDescription>Parked orders are saved in this browser. Resuming one parks the current cart.</DialogDescription>
          </DialogHeader>
          {held.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No held orders.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {held.map((o) => (
                <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.label} · {o.personCount} guests</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>{o.cart.reduce((n, c) => n + c.quantity, 0)} items · {new Date(o.at).toLocaleTimeString()}</p>
                  </div>
                  <Button size="sm" className="h-8 gap-1 rounded-full text-xs" onClick={() => resumeOrder(o)}><IconPlayerPlay className="h-3 w-3" /> Resume</Button>
                  <button aria-label="Discard held order" className="text-muted-foreground hover:text-destructive" onClick={() => discardHeld(o)}><IconTrash className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!ageGate} onOpenChange={(o) => !o && setAgeGate(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Age check</DialogTitle>
            <DialogDescription>{ageGate?.item ? `${ageGate.item.name} is for guests ${MIN_AGE}+.` : "This order includes alcohol."} Check the guest's ID and enter their date of birth. It is not stored.</DialogDescription>
          </DialogHeader>
          <Input type="date" className="rounded-xl border-0 bg-secondary" max={new Date().toISOString().slice(0, 10)} value={dob} onChange={(e) => { setDob(e.target.value); setAgeError("") }} />
          {ageError && <p role="alert" className="text-sm text-destructive">{ageError}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setAgeGate(null)}>Cancel</Button>
            <Button className="rounded-xl" disabled={!dob} onClick={confirmAge}>Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <IconAlertTriangle className="h-5 w-5" /> Allergen warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.item.name} contains <strong>{pending?.hit.join(", ")}</strong>, which {customerName} declared an allergy to. Adding it will be recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Don't add</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmOverride}>Add anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
