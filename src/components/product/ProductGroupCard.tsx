'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { proxyImageUrl } from '@/lib/proxy-image'
import { AddToCartButton } from './AddToCartButton'
import type { ProductGroup } from '@/lib/group-products'

const CONDITION_LABELS: Record<string, string> = {
  'mint': 'Sigillato',
  'near-mint': 'Near Mint',
  'lightly-played': 'Lightly Played',
  'moderately-played': 'Moderately Played',
  'heavily-played': 'Heavily Played',
  'damaged': 'Damaged',
  'graded': 'Graded',
}

const LANGUAGE_LABELS: Record<string, string> = {
  'italian': 'Italiano',
  'english': 'Inglese',
  'chinese': 'Cinese',
  'japanese': 'Giapponese',
}

interface ProductGroupCardProps {
  group: ProductGroup
}

export function ProductGroupCard({ group }: ProductGroupCardProps) {
  const [expanded, setExpanded] = useState(false)

  const imgSrc = proxyImageUrl(group.image)
  const categoryName = group.category?.name || ''
  const collectionName = group.collection?.name || ''

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-colors hover:border-zinc-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex gap-4">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={group.title}
              className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="h-24 w-24 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs flex-shrink-0">
              No img
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {categoryName && (
                <span className="text-xs text-zinc-500">{categoryName}</span>
              )}
            </div>
            <h3 className="text-white font-medium truncate">{group.title}</h3>
            {collectionName && (
              <p className="text-xs text-zinc-500 mt-0.5">{collectionName}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-bold text-white">
                {group.minPrice > 0 ? `€${group.minPrice.toFixed(2)}` : 'Prezzo in arrivo'}
              </span>
              <span className="text-xs text-zinc-500 rounded-full bg-zinc-800 px-2 py-0.5">
                {group.variantCount} {group.variantCount === 1 ? 'variante' : 'varianti'}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 self-center">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-zinc-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-500" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs">
                <th className="py-2">Lingua</th>
                <th className="py-2">Condizione</th>
                <th className="py-2 text-right">Prezzo</th>
                <th className="py-2 text-right">Disp.</th>
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {group.products.map((p) => (
                <tr key={p.id} className="border-t border-zinc-800/50">
                  <td className="py-2 text-zinc-300">
                    {LANGUAGE_LABELS[p.language] || p.language || '-'}
                  </td>
                  <td className="py-2 text-zinc-300">
                    {CONDITION_LABELS[p.condition] || p.condition || '-'}
                  </td>
                  <td className="py-2 text-right text-white font-medium">
                    {p.storePrice && p.storePrice > 0 ? `€${p.storePrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 text-right text-zinc-400">
                    {p.quantity || 0}
                  </td>
                  <td className="py-2 text-right">
                    {p.status === 'listed' && p.storePrice && p.storePrice > 0 && (
                      <AddToCartButton product={p} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
