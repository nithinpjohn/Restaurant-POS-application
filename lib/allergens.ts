// The 9 allergens commonly required on menus (EU/UK "14" trimmed to what this menu uses).
export const ALLERGENS = ["Gluten", "Dairy", "Eggs", "Fish", "Shellfish", "Nuts", "Peanuts", "Soy", "Sesame"] as const
export type Allergen = (typeof ALLERGENS)[number]

/** Allergens in `item` that the guest has declared. */
export const conflicts = (item: string[] = [], guest: string[]) => item.filter((a) => guest.includes(a))
