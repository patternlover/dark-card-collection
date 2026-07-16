import { ProductCard } from '@/components/product/ProductCard'

const placeholderProducts = [
  {
    id: '1',
    title: 'Booster Box Scarlet & Violet',
    slug: 'booster-box-scarlet-violet',
    price: 149.99,
    status: 'in-stock' as const,
    category: 'Booster Box',
    isNew: true,
    isBestseller: true,
  },
  {
    id: '2',
    title: 'ETB Paldea Evolved',
    slug: 'etb-paldea-evolved',
    price: 54.99,
    status: 'in-stock' as const,
    category: 'ETB',
    isNew: true,
    isBestseller: false,
  },
  {
    id: '3',
    title: 'Collection Box Charizard ex',
    slug: 'collection-box-charizard-ex',
    price: 89.99,
    status: 'preorder' as const,
    category: 'Collection Box',
    isNew: false,
    isBestseller: true,
  },
  {
    id: '4',
    title: 'SPC Crown Zenith',
    slug: 'spc-crown-zenith',
    price: 39.99,
    status: 'in-stock' as const,
    category: 'SPC',
    isNew: false,
    isBestseller: true,
  },
]

export function FeaturedProducts() {
  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">In Evidenza</h2>
          <a
            href="/shop/bestsellers"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Vedi tutti →
          </a>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {placeholderProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
