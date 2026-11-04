import { IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** In-page filter box (the global search lives in the header's Ctrl+K dialog). */
export function PageSearch({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={placeholder}
        className="rounded-xl border-0 bg-secondary pl-9 text-sm placeholder:text-muted-foreground"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
