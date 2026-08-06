export function ListingSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
      <div className="hidden lg:block" aria-hidden="true" />

      <div className="min-w-0">
        <div className="mb-4 h-4 w-44 animate-pulse rounded bg-zinc-800" />
        <div className="mb-6">
          <div className="mb-2 h-8 w-2/3 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="mb-6 h-12 w-full animate-pulse border-2 border-zinc-800 bg-zinc-800/60" />
        <div className="mb-6 h-4 w-28 animate-pulse rounded bg-zinc-800" />
      </div>

      <aside
        aria-hidden="true"
        className="mb-6 border-2 border-zinc-700 bg-zinc-900 p-5 shadow-[3px_3px_0px_0px_#27272a] lg:mb-0 lg:max-h-[calc(100vh-9rem)]"
      >
        <div className="mb-5 h-4 w-16 animate-pulse rounded bg-zinc-800" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-2 border-zinc-700 bg-zinc-900 shadow-[3px_3px_0px_0px_#27272a]"
            >
              <div className="p-3">
                <div className="aspect-square w-full animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="space-y-2 px-4 pb-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
