import { initialMenuItems } from "@/lib/data/menu"

export const WARN_MIN = 8 // ticket turns amber
export const LATE_MIN = 15 // ticket turns red and a late alert is raised
export const MAX_ALERT_AGE_MIN = 180 // don't raise late alerts for orders left over from an earlier day

const BY_CATEGORY: Record<string, number> = { Appetizers: 1, Drinks: 1, "Main Courses": 2, Desserts: 3 }
export const COURSE_NAMES: Record<number, string> = { 1: "Starters & drinks", 2: "Mains", 3: "Desserts" }

export const courseOf = (itemName: string) =>
  BY_CATEGORY[initialMenuItems.find((i) => i.name === itemName)?.category ?? ""] ?? 1

export const coursesIn = (names: string[]) => [...new Set(names.map(courseOf))].sort()

export const minutesSince = (ts: number, now: number) => Math.max(0, (now - ts) / 60_000)

export function formatElapsed(ts: number, now: number) {
  const s = Math.min(99 * 60 + 59, Math.floor((now - ts) / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export const urgency = (min: number) => (min >= LATE_MIN ? "late" : min >= WARN_MIN ? "warn" : "ok") as "ok" | "warn" | "late"
