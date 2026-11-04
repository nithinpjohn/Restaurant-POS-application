"use client"

import { IconCloudCheck, IconCloudOff, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useSync } from "./sync-provider"

/** Header chip: connection state, queue size and a panel to inspect and retry. */
export function SyncStatus() {
  const { online, forcedOffline, setForcedOffline, queue, syncing, lastSyncedAt, syncNow, clearFailed } = useSync()
  const waiting = queue.filter((i) => !i.failed).length
  const failed = queue.filter((i) => i.failed).length
  const label = !online ? "Offline" : waiting ? `${waiting} pending` : failed ? `${failed} failed` : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={online ? "Connection: online" : "Connection: offline"}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors",
            online && !waiting && !failed ? "bg-secondary text-muted-foreground hover:text-foreground" : !online ? "bg-amber-100 text-amber-800" : failed ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700",
          )}
        >
          {syncing ? <Spinner /> : online ? <IconCloudCheck className="h-4 w-4" /> : <IconCloudOff className="h-4 w-4" />}
          {label && <span>{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 rounded-xl">
        <div>
          <p className="text-sm font-medium">{online ? "Online" : "Offline"}</p>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {online ? (lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : "Connected to the server") : "New orders are saved on this device and sent when the connection returns. Card payments are unavailable."}
          </p>
        </div>

        {queue.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {queue.map((i) => (
              <li key={`${i.kind}:${i.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-2 py-1.5">
                <span>{i.kind === "order" ? "Order" : "Payment"} {i.id.replace(/^sale-/, "")}</span>
                <span className={cn(i.failed ? "text-destructive" : "text-muted-foreground")}>{i.failed ? i.error : i.attempts ? `retrying (${i.attempts})` : "waiting"}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl" disabled={!online || syncing || !waiting} onClick={syncNow}>
            {syncing ? <Spinner /> : <IconRefresh className="h-4 w-4" />} Sync now
          </Button>
          {failed > 0 && <Button size="sm" variant="outline" className="rounded-xl" onClick={clearFailed}>Clear failed</Button>}
        </div>

        <label className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
          <span>
            Work offline (test)
            <span className="block text-muted-foreground">Simulates losing the connection.</span>
          </span>
          <Switch checked={forcedOffline} onCheckedChange={setForcedOffline} aria-label="Work offline (test)" />
        </label>
      </PopoverContent>
    </Popover>
  )
}

export function OfflineBanner() {
  const { online } = useSync()
  if (online) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900 print:hidden">
      <IconCloudOff className="h-4 w-4 shrink-0" /> You're offline. Orders are saved on this device and will sync when you reconnect.
    </div>
  )
}
