"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, User, Settings, LogOut, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/new-order", label: "New Order" },
  { href: "/orders", label: "Orders" },
  { href: "/menu", label: "Menu" },
  { href: "/tables", label: "Tables" },
  { href: "/payment", label: "Payments" },
  { href: "/reports", label: "Reports" },
]

export function PosHeader({
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-card px-6 py-3 border-b border-border">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-semibold text-foreground">Kans Resto</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm rounded-lg transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pr-10 bg-secondary border-0 rounded-xl text-sm placeholder:text-muted-foreground"
              placeholder={searchPlaceholder || "Find food or beverages"}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl p-1.5 pr-3 hover:bg-secondary transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">EA</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">Emir Abiyyu</span>
                <span className="text-[11px] text-muted-foreground leading-tight">Manager</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">Emir Abiyyu</p>
                <p className="text-xs text-muted-foreground">emir@kansresto.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href="/login">
              <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
