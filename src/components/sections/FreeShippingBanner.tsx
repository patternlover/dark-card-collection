import { Truck } from 'lucide-react'

export function FreeShippingBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-[55] h-[var(--banner-h)] border-b-2 border-zinc-700 bg-[var(--accent)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center gap-2 px-4 sm:px-6 lg:px-8">
        <Truck className="h-4 w-4 shrink-0 text-black" strokeWidth={2.5} />
        <p className="text-center text-xs font-black uppercase tracking-widest text-black sm:text-sm">
          Spedizione gratuita in Italia dagli 80 €
        </p>
      </div>
    </div>
  )
}
