import { Suspense } from 'react'
import { ClientListing } from '@/components/sections/ClientListing'
import { ListingSkeleton } from '@/components/ui/ListingSkeleton'

interface ListingShellProps {
  title: string
  subtitle?: string
  action: string
  espansioni?: any[]
  products: any[]
  emptyTitle?: string
  emptySubtitle?: string
}

export function ListingShell({
  title,
  subtitle,
  action,
  espansioni = [],
  products,
  emptyTitle,
  emptySubtitle,
}: ListingShellProps) {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8 lg:pt-16">
        <Suspense fallback={<ListingSkeleton />}>
          <ClientListing
            products={products}
                        espansioni={espansioni}
            basePath={action}
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
