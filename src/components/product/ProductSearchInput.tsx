import { Search } from 'lucide-react'

interface ProductSearchInputProps {
  defaultValue?: string
}

export function ProductSearchInput({ defaultValue = '' }: ProductSearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Cerca per nome..."
        className="w-full border-2 border-zinc-700 bg-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 shadow-[3px_3px_0px_0px_#27272a] focus:border-[var(--accent)] focus:outline-none"
      />
    </div>
  )
}
