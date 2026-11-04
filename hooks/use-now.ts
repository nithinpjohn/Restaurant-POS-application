"use client"

import { useEffect, useState } from "react"

/** Current time that ticks every `ms`; null until mounted so server and client markup match. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}
