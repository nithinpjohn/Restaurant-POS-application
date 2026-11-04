import { cn } from "@/lib/utils"

/** Small allergen chips; `highlight` marks the ones that conflict with a guest's declared allergies. */
export function AllergenBadges({ allergens = [], highlight = [], className }: { allergens?: string[]; highlight?: string[]; className?: string }) {
  if (!allergens.length) return <p className={cn("text-[11px] text-muted-foreground", className)}>No listed allergens</p>
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {allergens.map((a) => (
        <span
          key={a}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            highlight.includes(a) ? "bg-red-100 text-red-700 ring-1 ring-red-300" : "bg-amber-50 text-amber-700",
          )}
        >
          {a}
        </span>
      ))}
    </div>
  )
}
