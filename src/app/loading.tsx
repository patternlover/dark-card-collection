export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm border-2 border-zinc-700 bg-zinc-900 p-8 text-center shadow-[4px_4px_0px_0px_#27272a]">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-[#FACC15]" />
        <p className="text-sm font-black uppercase tracking-widest text-white">
          Caricamento
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Dark Card Collection
        </p>
      </div>
    </div>
  )
}
