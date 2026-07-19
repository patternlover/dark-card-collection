'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { proxyImageUrl } from '@/lib/proxy-image'
import { EditProductModal } from './EditProductModal'
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

interface ProductGroupRowProps {
  group: ProductGroup
  password: string
  onProductUpdated: () => void
}

export function ProductGroupRow({ group, password, onProductUpdated }: ProductGroupRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const imgSrc = proxyImageUrl(group.image)

  return (
    <>
      <tr
        className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          {imgSrc ? (
            <img src={imgSrc} alt={group.title} className="h-10 w-10 rounded object-cover" loading="lazy" />
          ) : (
            <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">-</div>
          )}
        </td>
        <td className="px-4 py-3 text-white font-medium">{group.title}</td>
        <td className="px-4 py-3 text-zinc-400 text-sm">
          {group.category?.name || '-'}
        </td>
        <td className="px-4 py-3 text-zinc-400 text-sm">
          {group.collection?.name || '-'}
        </td>
        <td className="px-4 py-3 text-white font-medium">
          {group.minPrice > 0 ? `€${group.minPrice.toFixed(2)}` : '-'}
        </td>
        <td className="px-4 py-3">
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
            {group.variantCount} varianti
          </span>
        </td>
        <td className="px-4 py-3 text-zinc-400 text-sm">{group.totalQuantity}</td>
        <td className="px-4 py-3">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            group.products.some((p: any) => p.productState?.toUpperCase() === 'AVAILABLE')
              ? 'bg-green-900/50 text-green-400'
              : group.products.some((p: any) => p.productState?.toUpperCase() === 'HOLD')
              ? 'bg-yellow-900/50 text-yellow-400'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {group.products.find((p: any) => p.productState)?.productState || group.products.some((p: any) => p.status === 'listed') ? 'Disponibile' : '-'}
          </span>
        </td>
        <td className="px-4 py-3 w-8">
          {expanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </td>
      </tr>

      {expanded && group.products.map((p: any) => (
        <tr
          key={p.id}
          className="border-b border-zinc-800/30 bg-zinc-900/30 hover:bg-zinc-800/30 transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setEditingProduct(p) }}
        >
          <td className="px-4 py-2 pl-12">
            {proxyImageUrl(p.imageUrl) ? (
              <img src={proxyImageUrl(p.imageUrl)!} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
            ) : (
              <div className="h-8 w-8 rounded bg-zinc-800" />
            )}
          </td>
          <td className="px-4 py-2">
            <span className="text-zinc-400 text-xs font-mono">{p.itemId}</span>
          </td>
          <td className="px-4 py-2 text-zinc-300 text-sm">
            {LANGUAGE_LABELS[p.language] || p.language || '-'}
          </td>
          <td className="px-4 py-2 text-zinc-300 text-sm">
            {CONDITION_LABELS[p.condition] || p.condition || '-'}
          </td>
          <td className="px-4 py-2 text-white text-sm">
            {p.storePrice && p.storePrice > 0 ? `€${p.storePrice.toFixed(2)}` : '-'}
          </td>
          <td className="px-4 py-2 text-zinc-400 text-sm">{p.quantity || 0}</td>
          <td className="px-4 py-2" colSpan={2}>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              p.productState?.toUpperCase() === 'AVAILABLE' ? 'bg-green-900/50 text-green-400' :
              p.productState?.toUpperCase() === 'HOLD' ? 'bg-yellow-900/50 text-yellow-400' :
              p.productState ? 'bg-zinc-800 text-zinc-400' :
              p.status === 'listed' ? 'bg-green-900/50 text-green-400' :
              p.status === 'hold' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {p.productState || p.status || '-'}
            </span>
          </td>
        </tr>
      ))}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          password={password}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); onProductUpdated() }}
        />
      )}
    </>
  )
}
