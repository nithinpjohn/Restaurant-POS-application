"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

export function MenuEditForm({ item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "",
    price: item?.price || "",
    description: item?.description || "",
    image: item?.image || "/placeholder.svg?height=100&width=100",
    available: item?.available !== undefined ? item.available : true,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCategoryChange = (value) => {
    setFormData({
      ...formData,
      category: value,
    })
  }

  const handleAvailabilityChange = (checked) => {
    setFormData({
      ...formData,
      available: checked,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate form
    if (!formData.name || !formData.category || !formData.price) {
      alert("Please fill in all required fields")
      return
    }

    // Convert price to number
    const priceAsNumber = Number.parseFloat(formData.price)
    if (isNaN(priceAsNumber)) {
      alert("Price must be a valid number")
      return
    }

    // Submit the form data
    onSubmit({
      ...formData,
      price: priceAsNumber,
      id: item?.id, // Keep the original ID if editing
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name*
          </Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="category" className="text-right">
            Category*
          </Label>
          <Select value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Appetizers">Appetizers</SelectItem>
              <SelectItem value="Main Courses">Main Courses</SelectItem>
              <SelectItem value="Desserts">Desserts</SelectItem>
              <SelectItem value="Drinks">Drinks</SelectItem>
              <SelectItem value="Sides">Sides</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="price" className="text-right">
            Price*
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="image" className="text-right">
            Image URL
          </Label>
          <Input id="image" name="image" value={formData.image} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="col-span-3"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="available" className="text-right">
            Available
          </Label>
          <div className="col-span-3 flex items-center gap-2">
            <Switch id="available" checked={formData.available} onCheckedChange={handleAvailabilityChange} />
            <span className="text-sm text-muted-foreground">
              {formData.available ? "Item is available" : "Item is unavailable"}
            </span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  )
}
