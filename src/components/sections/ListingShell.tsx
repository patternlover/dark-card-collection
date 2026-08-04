import { Suspense } from 'react'
import { ClientListing } from '@/components/sections/ClientListing'

interface ListingShellProps {
  title: string
  subtitle?: string
  action: string
  categories?: any[]
  collections?: any[]
  products: any[]
  grouped?: boolean
  emptyTitle?: string
  emptySubtitle?: string
}

export function ListingShell({
  title,
  subtitle,
  action,
  categories = [],
  collections = [],
  products,
  grouped = true,
  emptyTitle,
  emptySubtitle,
}: ListingShellProps) {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
        </div>

        <Suspense
          fallback={
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">Caricamento prodotti...</p>
            </div>
          }
        >
          <ClientListing
            products={products}
            categories={categories}
            collections={collections}
            basePath={action}
            grouped={grouped}
            emptyTitle={emptyTitle}
            emptySubtitle={emptySubtitle}
          />
        </Suspense>
      </div>
    </div>
  )
}
