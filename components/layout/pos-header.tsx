"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconUser, IconSettings, IconLogout, IconBell, IconCheck, IconHistory } from "@tabler/icons-react"
import { CommandSearch } from "@/components/layout/command-search"
import { useAuth } from "@/components/auth/auth-provider"
import { USERS, type Role } from "@/lib/permissions"
import { useNotifications } from "@/components/notifications/notifications-provider"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.newOrder, label: "New Order" },
  { href: ROUTES.orders, label: "Orders" },
  { href: ROUTES.kitchen, label: "Kitchen" },
  { href: ROUTES.menu, label: "Menu" },
  { href: ROUTES.tables, label: "Tables" },
  { href: ROUTES.payment, label: "Payments" },
  { href: ROUTES.reports, label: "Reports" },
]

export function PosHeader() {
  const pathname = usePathname()
  const { unreadCount, setPanelOpen } = useNotifications()
  const { user, role, setRole } = useAuth()
  const initials = user.name.split(" ").map((w) => w[0]).join("")

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-card px-6 py-3 border-b border-border">
      <div className="flex items-center gap-8">
        <Link href={ROUTES.dashboard} className="flex items-center gap-2">
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
        <CommandSearch />

        <button
          aria-label={`Notifications (${unreadCount} unread)`}
          onClick={() => setPanelOpen(true)}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <IconBell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl p-1.5 pr-3 hover:bg-secondary transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">{user.name}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{user.label}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
              <IconUser className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
              <IconSettings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Switch role (demo)</DropdownMenuLabel>
            {(Object.keys(USERS) as Role[]).map((r) => (
              <DropdownMenuItem key={r} className="cursor-pointer gap-2 rounded-lg" onClick={() => setRole(r)}>
                <span className="flex-1">{USERS[r].label}</span>
                {r === role && <IconCheck className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Link href={ROUTES.auditLog}>
              <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
                <IconHistory className="h-4 w-4" />
                <span>Audit log</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link href={ROUTES.login}>
              <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive">
                <IconLogout className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
