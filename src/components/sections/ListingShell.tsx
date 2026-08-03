import { ProductFiltersSidebar } from '@/components/product/ProductFiltersSidebar'
import { ProductSearchInput } from '@/components/product/ProductSearchInput'
import type { ListingParams } from '@/lib/product-filters'

interface ListingShellProps {
  title: string
  subtitle?: string
  action: string
  searchDefault: string
  categories?: any[]
  collections?: any[]
  params: ListingParams
  children: React.ReactNode
}

export function ListingShell({
  title,
  subtitle,
  action,
  searchDefault,
  categories = [],
  collections = [],
  params,
  children,
}: ListingShellProps) {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form action={action} method="GET" className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
          <div className="mb-6 lg:col-start-2 lg:row-start-1 lg:mb-0">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
          </div>

          <div className="mb-6 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mb-0">
            <ProductFiltersSidebar
              action={action}
              categories={categories}
              collections={collections}
              params={params}
            />
          </div>

          <div className="lg:col-start-2 lg:row-start-2">
            <div className="mb-6">
              <ProductSearchInput defaultValue={searchDefault} />
            </div>
            {children}
          </div>
        </form>
      </div>
    </div>
  )
}
