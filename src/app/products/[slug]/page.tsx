'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/product/ProductCard'
import { Minus, Plus, ShoppingBag, Truck, Shield, Package } from 'lucide-react'

// Placeholder - will be replaced with Payload data
const product = {
  id: '1',
  title: 'Booster Box Scarlet & Violet',
  slug: 'booster-box-scarlet-violet',
  description: 'La prima booster box della serie Scarlet & Violet. Contiene 36 booster pack da 10 carte ciascuna. La nuova meccanica della Teracristallo cambia il modo di giocare!',
  price: 149.99,
  compareAtPrice: 169.99,
  category: 'Booster Box',
  collection: 'Scarlet & Violet',
  status: 'in-stock' as 'in-stock' | 'preorder' | 'out-of-stock',
  sealed: true,
  features: ['36 Booster Pack', '10 carte per pack', 'Nuova meccanica Teracristallo', 'Carte illustration rara'],
  sku: 'SV-BB-001',
  isNew: true,
  isBestseller: true,
  quantity: 15,
  images: [],
}

const relatedProducts = [
  { id: '2', title: 'ETB Paldea Evolved', slug: 'etb-paldea-evolved', price: 54.99, status: 'in-stock' as const, category: 'ETB', isNew: true },
  { id: '3', title: 'Collection Box Charizard ex', slug: 'collection-box-charizard-ex', price: 89.99, status: 'preorder' as const, category: 'Collection Box', isBestseller: true },
  { id: '4', title: 'SPC Crown Zenith', slug: 'spc-crown-zenith', price: 39.99, status: 'in-stock' as const, category: 'SPC', isBestseller: true },
]

export default function ProductPage() {
  const [quantity, setQuantity] = useState(1)

  const statusLabels = {
    'in-stock': 'Disponibile',
    'preorder': 'Preordine',
    'out-of-stock': 'Esaurito',
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square rounded bg-zinc-800" />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2">
              {product.isNew && <Badge variant="new">Novità</Badge>}
              {product.isBestseller && <Badge variant="bestseller">Bestseller</Badge>}
              <Badge variant={product.status === 'preorder' ? 'preorder' : 'default'}>
                {statusLabels[product.status]}
              </Badge>
              {product.sealed && (
                <Badge variant="default">Sigillato</Badge>
              )}
            </div>

            {/* Breadcrumb */}
            <div className="text-sm text-zinc-500">
              <span>Shop</span>
              <span className="mx-2">/</span>
              <span>{product.category}</span>
              <span className="mx-2">/</span>
              <span>{product.collection}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white">{product.title}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-white">
                €{product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-zinc-500 line-through">
                  €{product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Features */}
            {product.features && (
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Caratteristiche</h3>
                <ul className="space-y-1">
                  {product.features.map((feature, i) => (
                    <li key={i} className="text-sm text-zinc-400">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">Quantità</span>
                <div className="flex items-center rounded-lg border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-zinc-400 hover:text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="p-3 text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-zinc-500">
                  {product.quantity} disponibili
                </span>
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-base font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                <ShoppingBag className="h-5 w-5" />
                Aggiungi al carrello
              </button>
            </div>

            {/* Trust */}
            <div className="space-y-3 rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Truck className="h-5 w-5 text-zinc-500" />
                <span>Spedizione gratuita sopra i €100</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield className="h-5 w-5 text-zinc-500" />
                <span>Prodotto 100% originale e sigillato</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Package className="h-5 w-5 text-zinc-500" />
                <span>Packaging professionale e sicuro</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Descrizione</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* SKU */}
            <p className="text-xs text-zinc-600">SKU: {product.sku}</p>
          </div>
        </div>

        {/* Related Products */}
        <section className="mt-16 border-t border-zinc-800 pt-12">
          <h2 className="text-2xl font-bold text-white mb-8">Prodotti Correlati</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
