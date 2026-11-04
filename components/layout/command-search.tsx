"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconBell,
  IconCirclePlus,
  IconCreditCard,
  IconFileText,
  IconHistory,
  IconLayoutDashboard,
  IconReceipt,
  IconSearch,
  IconTable,
  IconToolsKitchen2,
} from "@tabler/icons-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import { initialMenuItems } from "@/lib/data/menu"
import { initialOrders } from "@/lib/data/orders"
import { ROUTES } from "@/lib/routes"

const suggestions = [
  { label: "Start a new order", icon: IconCirclePlus, href: ROUTES.newOrder, hint: "N" },
  { label: "Add menu item", icon: IconToolsKitchen2, href: ROUTES.menu },
  { label: "Process a payment", icon: IconCreditCard, href: ROUTES.payment },
  { label: "View notifications", icon: IconBell, href: ROUTES.notifications },
  { label: "View audit log", icon: IconHistory, href: ROUTES.auditLog },
]
const pages = [
  { label: "Dashboard", icon: IconLayoutDashboard, href: ROUTES.dashboard },
  { label: "Orders", icon: IconReceipt, href: ROUTES.orders },
  { label: "Menu", icon: IconToolsKitchen2, href: ROUTES.menu },
  { label: "Tables", icon: IconTable, href: ROUTES.tables },
  { label: "Reports", icon: IconFileText, href: ROUTES.reports },
]

export function CommandSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [term, setTerm] = useState("") // debounced query
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Debounce + skeleton while "searching".
  useEffect(() => {
    if (!query.trim()) { setTerm(""); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(() => { setTerm(query.trim().toLowerCase()); setLoading(false) }, 350)
    return () => clearTimeout(t)
  }, [query])

  const results = useMemo(() => {
    if (!term) return null
    const has = (...s: string[]) => s.some((x) => x.toLowerCase().includes(term))
    return {
      items: initialMenuItems.filter((i) => has(i.name, i.category, i.description)).slice(0, 5),
      orders: initialOrders.filter((o) => has(o.id, o.table, o.status)).slice(0, 5),
      pages: [...pages, ...suggestions].filter((p) => has(p.label)).slice(0, 5),
    }
  }, [term])

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }
  const empty = results && !results.items.length && !results.orders.length && !results.pages.length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-xl bg-secondary px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Open search"
      >
        <IconSearch className="h-4 w-4" />
        <span className="hidden xl:inline">Search</span>
        <Kbd className="hidden xl:inline-flex">Ctrl K</Kbd>
      </button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery("") }}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search pages, menu items and orders.</DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search menu, orders, pages…" value={query} onValueChange={setQuery} />
            <CommandList className="max-h-96">
              {loading ? (
                <div className="space-y-3 p-3" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !results ? (
                <>
                  <CommandGroup heading="Suggested">
                    {suggestions.map((s) => (
                      <CommandItem key={s.label} value={s.label} onSelect={() => go(s.href)}>
                        <s.icon /> {s.label}
                        {s.hint && <CommandShortcut>{s.hint}</CommandShortcut>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Go to">
                    {pages.map((p) => (
                      <CommandItem key={p.label} value={p.label} onSelect={() => go(p.href)}>
                        <p.icon /> {p.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : empty ? (
                <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">No results for “{query}”</CommandEmpty>
              ) : (
                <>
                  {results.items.length > 0 && (
                    <CommandGroup heading="Menu items">
                      {results.items.map((i) => (
                        <CommandItem key={i.id} value={`item-${i.id}`} onSelect={() => go(ROUTES.menu)}>
                          <IconToolsKitchen2 /> {i.name}
                          <CommandShortcut>${i.price.toFixed(2)}</CommandShortcut>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {results.orders.length > 0 && (
                    <CommandGroup heading="Orders">
                      {results.orders.map((o) => (
                        <CommandItem key={o.id} value={o.id} onSelect={() => go(ROUTES.orders)}>
                          <IconReceipt /> {o.id} · {o.table}
                          <CommandShortcut>{o.status}</CommandShortcut>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {results.pages.length > 0 && (
                    <CommandGroup heading="Pages & actions">
                      {results.pages.map((p) => (
                        <CommandItem key={p.label} value={`page-${p.label}`} onSelect={() => go(p.href)}>
                          <p.icon /> {p.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
