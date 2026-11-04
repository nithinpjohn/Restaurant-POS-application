"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { can as canDo, USERS, type Permission, type Role } from "@/lib/permissions"

type Ctx = {
  role: Role
  user: (typeof USERS)[Role]
  /** Display string used as the audit-log actor. */
  actor: string
  setRole: (r: Role) => void
  can: (p: Permission) => boolean
}

const KEY = "kans-resto-role"
const AuthContext = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("manager")

  useEffect(() => {
    try { const r = localStorage.getItem(KEY) as Role | null; if (r && r in USERS) setRoleState(r) } catch {}
  }, [])

  const value = useMemo<Ctx>(() => {
    const user = USERS[role]
    return {
      role,
      user,
      actor: `${user.name} (${user.label})`,
      setRole: (r) => { setRoleState(r); try { localStorage.setItem(KEY, r) } catch {} },
      can: (p) => canDo(role, p),
    }
  }, [role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
