import { Skeleton } from "@/components/ui/skeleton"

/** Shared route-level loading UI: header bar, title row, and a card grid. */
export function PageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background" aria-busy="true">
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="hidden h-9 w-96 md:block" />
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <div className="flex justify-between"><Skeleton className="h-5 w-14" /><Skeleton className="h-7 w-24 rounded-full" /></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
