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
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8 lg:pt-32">
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
            title={title}
            subtitle={subtitle}
          />
        </Suspense>
      </div>
    </div>
  )
}
