"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAudit } from "@/components/audit/audit-provider"
import { ROUTES } from "@/lib/routes"

const IDLE_MS = 5 * 60_000 // total idle time before sign-out
const WARN_MS = 60_000 // warning shown for the last minute
const EVENTS = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"] as const

/** Signs the user out after a period of inactivity, with a countdown warning first. */
export function SessionTimeout() {
  const router = useRouter()
  const { log } = useAudit()
  const last = useRef(Date.now())
  const warning = useRef(false)
  const [left, setLeft] = useState<number | null>(null) // seconds, null = no warning

  useEffect(() => {
    const touch = () => { if (!warning.current) last.current = Date.now() }
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }))

    const timer = setInterval(() => {
      const idle = Date.now() - last.current
      if (idle >= IDLE_MS) {
        clearInterval(timer)
        log({ category: "System", action: "Session timed out", detail: "Signed out after inactivity" })
        router.push(ROUTES.login)
      } else if (idle >= IDLE_MS - WARN_MS) {
        warning.current = true
        setLeft(Math.ceil((IDLE_MS - idle) / 1000))
      }
    }, 1000)

    return () => {
      clearInterval(timer)
      EVENTS.forEach((e) => window.removeEventListener(e, touch))
    }
  }, [log, router])

  const stay = () => { last.current = Date.now(); warning.current = false; setLeft(null) }

  return (
    <AlertDialog open={left !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Still there?</AlertDialogTitle>
          <AlertDialogDescription>For security you'll be signed out in {left}s because of inactivity.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => router.push(ROUTES.login)}>Log out now</AlertDialogCancel>
          <AlertDialogAction onClick={stay}>Stay signed in</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
