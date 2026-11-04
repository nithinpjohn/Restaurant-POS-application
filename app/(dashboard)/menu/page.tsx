"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { MenuEditForm } from "@/components/menu/menu-edit-form"
import { Switch } from "@/components/ui/switch"
import { PosHeader } from "@/components/layout/pos-header"
import { cn } from "@/lib/utils"
import { initialMenuItems } from "@/lib/data/menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { delay } from "@/lib/mock"
import { useApproval } from "@/components/auth/approval-provider"
import { PageSearch } from "@/components/layout/page-search"
import { AllergenBadges } from "@/components/menu/allergen-badges"
import { useAudit } from "@/components/audit/audit-provider"
import { ROUTES } from "@/lib/routes"


const categories = ["All", "Appetizers", "Main Courses", "Desserts", "Drinks"]

export default function MenuPage() {
  const { notify } = useNotifications()
  const { log } = useAudit()
  const { requestApproval } = useApproval()
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { delay(700).then(() => setLoading(false)) }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [editingItem, setEditingItem] = useState<typeof initialMenuItems[0] | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<typeof initialMenuItems[0] | null>(null)

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "All" || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleAddItem = async (newItem: any) => {
    setSaving(true)
    await delay()
    const newId = Math.max(...menuItems.map((item) => item.id), 0) + 1
    setMenuItems([...menuItems, { ...newItem, id: newId }])
    setSaving(false)
    setIsAddDialogOpen(false)
    log({ category: "Menu", action: "Menu item added", detail: `${newItem.name} · $${Number(newItem.price).toFixed(2)} · allergens: ${newItem.allergens?.join(", ") || "none"}` })
    notify({ title: "Menu item added", description: `${newItem.name} is now on the menu.`, href: ROUTES.menu })
  }

  const handleEditItem = async (updatedItem: any) => {
    setSaving(true)
    await delay()
    setSaving(false)
    setMenuItems(menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setIsEditDialogOpen(false)
    setEditingItem(null)
    log({ category: "Menu", action: "Menu item updated", detail: `${updatedItem.name} · $${Number(updatedItem.price).toFixed(2)} · allergens: ${updatedItem.allergens?.join(", ") || "none"}` })
    notify({ title: "Menu item updated", description: `${updatedItem.name} was saved.`, type: "info" })
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    await delay()
    setMenuItems(menuItems.filter((item) => item.id !== itemToDelete.id))
    setDeleting(false)
    setIsDeleteDialogOpen(false)
    log({ category: "Menu", action: "Menu item deleted", detail: itemToDelete.name, flagged: true })
    notify({ title: "Menu item deleted", description: `${itemToDelete.name} was removed.`, type: "warning" })
    setItemToDelete(null)
  }

  const toggleAvailability = (id: number, checked: boolean) => {
    setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, available: checked } : item)))
    const name = menuItems.find((i) => i.id === id)?.name
    log({ category: "Menu", action: `Marked ${checked ? "available" : "unavailable"}`, detail: name })
    notify({ title: `${name} ${checked ? "available" : "unavailable"}`, type: checked ? "success" : "warning" })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Menu Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <IconPlus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>Create a new item for your restaurant menu.</DialogDescription>
              </DialogHeader>
              <MenuEditForm submitting={saving} onSubmit={handleAddItem} onCancel={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <PageSearch value={searchTerm} onChange={setSearchTerm} placeholder="Search menu items…" className="mb-4" />

        {/* Category Filters */}
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy={loading}>
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <div className="flex justify-between"><Skeleton className="h-5 w-14" /><Skeleton className="h-7 w-24 rounded-full" /></div>
            </div>
          ))}
          {!loading && filteredItems.map((item) => (
            <div key={item.id} className={cn("bg-card border border-border rounded-2xl p-3 transition-opacity", !item.available && "opacity-50")}>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-secondary">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">{item.name}{item.ageRestricted && <span className="ml-1.5 rounded bg-foreground px-1 py-0.5 text-[10px] font-semibold text-background">18+</span>}</h3>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">{item.available ? "On" : "Off"}</span>
                  <Switch checked={item.available} onCheckedChange={(checked) => toggleAvailability(item.id, checked)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
              <AllergenBadges allergens={item.allergens} className="mb-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">${item.price.toFixed(2)}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-full px-3 gap-1"
                    onClick={() => { setEditingItem(item); setIsEditDialogOpen(true) }}
                  >
                    <IconEdit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={async () => {
                      if (!(await requestApproval({ perm: "menu.delete", reason: `Delete ${item.name}` }))) return
                      setItemToDelete(item); setIsDeleteDialogOpen(true)
                    }}
                  >
                    <IconTrash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Make changes to the menu item.</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <MenuEditForm submitting={saving} item={editingItem} onSubmit={handleEditItem} onCancel={() => setIsEditDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {itemToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" disabled={deleting} onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" disabled={deleting} onClick={handleDeleteItem}>
              {deleting && <Spinner />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
