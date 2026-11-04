"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { IconBackspace, IconShieldLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAudit } from "@/components/audit/audit-provider"
import { useAuth } from "@/components/auth/auth-provider"
import { MANAGER_PIN, type Permission } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type Request = { perm: Permission; reason: string }
type Ctx = { /** Resolves true if the current role may act, or a manager PIN was entered. */ requestApproval: (r: Request) => Promise<boolean> }

const ApprovalContext = createContext<Ctx | null>(null)
const MAX_TRIES = 3
const LOCK_MS = 30_000
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const

export function ApprovalProvider({ children }: { children: React.ReactNode }) {
  const { can, user } = useAuth()
  const { log } = useAudit()
  const [req, setReq] = useState<Request | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [tries, setTries] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const locked = lockedUntil > now

  useEffect(() => {
    if (!locked) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [locked])

  const requestApproval = useCallback(
    (r: Request) => {
      if (can(r.perm)) return Promise.resolve(true)
      return new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setPin(""); setError(""); setReq(r)
      })
    },
    [can],
  )

  const finish = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setReq(null)
  }

  const submit = (value: string) => {
    if (!req || locked) return
    if (value === MANAGER_PIN) {
      log({ category: "System", action: "Manager approval granted", detail: `${req.reason} · requested by ${user.name}`, flagged: true })
      setTries(0)
      finish(true)
      return
    }
    const n = tries + 1
    setPin("")
    if (n >= MAX_TRIES) {
      setTries(0)
      setNow(Date.now()); setLockedUntil(Date.now() + LOCK_MS)
      setError("")
      log({ category: "System", action: "Manager PIN locked after failed attempts", detail: `${req.reason} · requested by ${user.name}`, flagged: true })
    } else {
      setTries(n)
      setError(`Incorrect PIN. ${MAX_TRIES - n} attempt${MAX_TRIES - n === 1 ? "" : "s"} left.`)
    }
  }

  const press = (k: (typeof KEYS)[number]) => {
    if (locked) return
    setError("")
    if (k === "clear") return setPin("")
    if (k === "back") return setPin((p) => p.slice(0, -1))
    const next = (pin + k).slice(0, 4)
    setPin(next)
    if (next.length === 4) submit(next)
  }

  return (
    <ApprovalContext.Provider value={{ requestApproval }}>
      {children}
      <Dialog open={!!req} onOpenChange={(o) => { if (!o) finish(false) }}>
        <DialogContent
          className="sm:max-w-xs"
          onKeyDown={(e) => {
            if (/^\d$/.test(e.key)) press(e.key as (typeof KEYS)[number])
            else if (e.key === "Backspace") press("back")
          }}
        >
          <DialogHeader className="items-center text-center">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><IconShieldLock className="h-5 w-5" /></div>
            <DialogTitle>Manager approval</DialogTitle>
            <DialogDescription>{req?.reason}. Ask a manager to enter their PIN.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-3" aria-label={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-3 w-3 rounded-full border border-border", i < pin.length && "border-primary bg-primary")} />)}
          </div>
          <p role="alert" className="min-h-4 text-center text-xs text-destructive">
            {locked ? `Too many attempts. Try again in ${Math.ceil((lockedUntil - now) / 1000)}s.` : error}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <Button
                key={k}
                type="button"
                variant="outline"
                disabled={locked}
                className="h-12 rounded-xl text-base"
                aria-label={k === "back" ? "Backspace" : k === "clear" ? "Clear" : k}
                onClick={() => press(k)}
              >
                {k === "back" ? <IconBackspace className="h-5 w-5" /> : k === "clear" ? <span className="text-xs">Clear</span> : k}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </ApprovalContext.Provider>
  )
}

export function useApproval() {
  const ctx = useContext(ApprovalContext)
  if (!ctx) throw new Error("useApproval must be used inside <ApprovalProvider>")
  return ctx
}
