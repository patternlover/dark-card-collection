export function LoadingFallback({ label = 'Caricamento...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="h-1 w-28 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--accent)]" />
        </div>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  )
}
