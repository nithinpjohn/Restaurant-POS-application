"use client"

import { useState } from "react"
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
import { Edit, Plus, Trash2 } from "lucide-react"
import { MenuEditForm } from "@/components/menu-edit-form"
import { Switch } from "@/components/ui/switch"
import { PosHeader } from "@/components/pos-header"
import { cn } from "@/lib/utils"

const initialMenuItems = [
  { id: 1, name: "Caesar Salad", category: "Appetizers", price: 8.99, image: "/images/caesar-salad.jpg", description: "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese.", available: true },
  { id: 2, name: "Margherita Pizza", category: "Main Courses", price: 14.99, image: "/images/margherita-pizza.jpg", description: "Classic pizza with tomato sauce, fresh mozzarella, and basil.", available: true },
  { id: 3, name: "Chocolate Cake", category: "Desserts", price: 6.99, image: "/images/chocolate-cake.jpg", description: "Rich chocolate cake with a layer of chocolate ganache.", available: true },
  { id: 4, name: "Garlic Bread", category: "Appetizers", price: 4.99, image: "/images/garlic-bread.jpg", description: "Toasted bread with garlic butter and herbs.", available: true },
  { id: 5, name: "Grilled Salmon", category: "Main Courses", price: 18.99, image: "/images/grilled-salmon.jpg", description: "Fresh salmon fillet grilled with lemon and herbs, served with seasonal vegetables.", available: true },
  { id: 6, name: "Tiramisu", category: "Desserts", price: 7.99, image: "/images/tiramisu.jpg", description: "Italian dessert made of ladyfingers dipped in coffee, layered with mascarpone cheese.", available: true },
  { id: 7, name: "Iced Tea", category: "Drinks", price: 2.99, image: "/images/iced-tea.jpg", description: "Refreshing iced tea with lemon slice.", available: true },
  { id: 8, name: "Chicken Alfredo", category: "Main Courses", price: 16.99, image: "/images/chicken-alfredo.jpg", description: "Fettuccine pasta with creamy Alfredo sauce and grilled chicken.", available: true },
  { id: 9, name: "Cheesecake", category: "Desserts", price: 6.99, image: "/images/cheesecake.jpg", description: "Creamy New York style cheesecake with graham cracker crust.", available: true },
]

const categories = ["All", "Appetizers", "Main Courses", "Desserts", "Drinks"]

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState(initialMenuItems)
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

  const handleAddItem = (newItem: any) => {
    const newId = Math.max(...menuItems.map((item) => item.id), 0) + 1
    setMenuItems([...menuItems, { ...newItem, id: newId }])
    setIsAddDialogOpen(false)
  }

  const handleEditItem = (updatedItem: any) => {
    setMenuItems(menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setIsEditDialogOpen(false)
    setEditingItem(null)
  }

  const handleDeleteItem = () => {
    if (itemToDelete) {
      setMenuItems(menuItems.filter((item) => item.id !== itemToDelete.id))
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const toggleAvailability = (id: number, checked: boolean) => {
    setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, available: checked } : item)))
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader searchPlaceholder="Search menu items..." searchValue={searchTerm} onSearchChange={setSearchTerm} />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Menu Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>Create a new item for your restaurant menu.</DialogDescription>
              </DialogHeader>
              <MenuEditForm onSubmit={handleAddItem} onCancel={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div key={item.id} className={cn("bg-card border border-border rounded-2xl p-3 transition-opacity", !item.available && "opacity-50")}>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-secondary">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">{item.available ? "On" : "Off"}</span>
                  <Switch checked={item.available} onCheckedChange={(checked) => toggleAvailability(item.id, checked)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">${item.price.toFixed(2)}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-full px-3 gap-1"
                    onClick={() => { setEditingItem(item); setIsEditDialogOpen(true) }}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => { setItemToDelete(item); setIsDeleteDialogOpen(true) }}
                  >
                    <Trash2 className="h-3 w-3" />
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
            <MenuEditForm item={editingItem} onSubmit={handleEditItem} onCancel={() => setIsEditDialogOpen(false)} />
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
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
