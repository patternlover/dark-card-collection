'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFilters } from '@/components/product/ProductFilters'

const categories = [
  { id: 'all', name: 'Tutti' },
  { id: 'booster-box', name: 'Booster Box' },
  { id: 'etb', name: 'ETB' },
  { id: 'collection-box', name: 'Collection Box' },
  { id: 'spc', name: 'SPC' },
  { id: 'tin', name: 'Tin' },
  { id: 'bundle', name: 'Bundle' },
]

const sortOptions = [
  { value: 'newest', label: 'Più recenti' },
  { value: 'price-asc', label: 'Prezzo: basso → alto' },
  { value: 'price-desc', label: 'Prezzo: alto → basso' },
  { value: 'bestseller', label: 'Bestseller' },
]

const placeholderProducts = [
  { id: '1', title: 'Booster Box Scarlet & Violet', slug: 'booster-box-scarlet-violet', price: 149.99, status: 'in-stock' as const, category: 'Booster Box', isNew: true, isBestseller: true },
  { id: '2', title: 'ETB Paldea Evolved', slug: 'etb-paldea-evolved', price: 54.99, status: 'in-stock' as const, category: 'ETB', isNew: true },
  { id: '3', title: 'Collection Box Charizard ex', slug: 'collection-box-charizard-ex', price: 89.99, status: 'preorder' as const, category: 'Collection Box', isBestseller: true },
  { id: '4', title: 'SPC Crown Zenith', slug: 'spc-crown-zenith', price: 39.99, status: 'in-stock' as const, category: 'SPC', isBestseller: true },
  { id: '5', title: 'Booster Box Obsidian Flames', slug: 'booster-box-obsidian-flames', price: 139.99, status: 'in-stock' as const, category: 'Booster Box' },
  { id: '6', title: 'Tin Pikachu VMAX', slug: 'tin-pikachu-vmax', price: 29.99, status: 'in-stock' as const, category: 'Tin' },
]

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const filteredProducts = placeholderProducts.filter(
    (p) => selectedCategory === 'all' || p.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory
  )

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Shop</h1>
          <p className="mt-2 text-zinc-400">
            Esplora la nostra collezione di prodotti Pokémon TCG sigillati
          </p>
        </div>

        {/* Filters bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-zinc-500">Nessun prodotto trovato per questa categoria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
