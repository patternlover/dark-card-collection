'use client'

import { useState } from 'react'
import { Link as LinkIcon, ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react'
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
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [togglingVisible, setTogglingVisible] = useState(false)

  const imgSrc = proxyImageUrl(group.image)
  const isVisible = group.products.some((p: any) => p.isVisible !== false)

  const handleDelete = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation()
    if (!confirm('Eliminare questa variante? Il record verrà rimosso dal sito ma rimarrà nel Google Sheet.')) return

    setDeleting(productId)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'x-sync-password': password },
      })
      if (!res.ok) throw new Error('Eliminazione fallita')
      onProductUpdated()
    } catch (err) {
      alert(String(err))
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleVisible = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const product = group.products[0]
    if (!product) return

    setTogglingVisible(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-password': password,
        },
        body: JSON.stringify({ isVisible: !isVisible }),
      })
      if (!res.ok) throw new Error('Toggle fallito')
      onProductUpdated()
    } catch (err) {
      alert(String(err))
    } finally {
      setTogglingVisible(false)
    }
  }

  return (
    <>
      <tr className="border-b-2 border-zinc-800 bg-zinc-900">
        <td className="px-4 py-3">
          {imgSrc ? (
            <img src={imgSrc} alt={group.title} className="h-10 w-10 border border-zinc-700 object-cover" loading="lazy" />
          ) : (
            <div className="h-10 w-10 border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">-</div>
          )}
        </td>
        <td className="px-4 py-3 text-white font-semibold">{group.title}</td>
        <td className="px-4 py-3 text-zinc-400 text-sm">
          {group.collection?.name || '-'}
        </td>
        <td className="px-4 py-3 text-[#FACC15] font-bold">
          {group.sellingPrice > 0 ? `€${group.sellingPrice.toFixed(2)}` : '-'}
        </td>
        <td className="px-4 py-3 text-zinc-400 text-sm font-medium">{group.totalQuantity}</td>
        <td className="px-4 py-3">
          <span className={`inline-block border px-2 py-0.5 text-xs font-bold ${
            group.products.some((p: any) => p.productState?.toUpperCase() === 'AVAILABLE')
              ? 'border-green-700 bg-green-950 text-green-400'
              : group.products.some((p: any) => p.productState?.toUpperCase() === 'HOLD')
              ? 'border-yellow-700 bg-yellow-950 text-yellow-400'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
          }`}>
            {group.products.find((p: any) => p.productState)?.productState || group.products.some((p: any) => p.status === 'listed') ? 'Disponibile' : '-'}
          </span>
        </td>
        <td className="px-4 py-2">
          <button
            onClick={handleToggleVisible}
            disabled={togglingVisible}
            className={`transition-colors disabled:opacity-50 ${isVisible ? 'text-[#FACC15] hover:text-zinc-400' : 'text-zinc-600 hover:text-[#FACC15]'}`}
            title={isVisible ? 'Nello shop — clicca per nascondere' : 'Nascosto — clicca per mostrare'}
          >
            {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </td>
      </tr>

      {group.products.map((p: any) => (
        <tr
          key={p.id}
          className="border-b border-zinc-800/50 bg-zinc-950 hover:bg-zinc-900/50 transition-colors cursor-pointer"
          onClick={() => setEditingProduct(p)}
        >
          <td className="px-4 py-2 pl-12">
            {proxyImageUrl(p.imageUrl) ? (
              <img src={proxyImageUrl(p.imageUrl)!} alt="" className="h-8 w-8 border border-zinc-700 object-cover" loading="lazy" />
            ) : (
              <div className="h-8 w-8 border border-zinc-700 bg-zinc-800" />
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
          <td className="px-4 py-2 text-white text-sm font-medium">
            {p.storePrice && p.storePrice > 0 ? `€${p.storePrice.toFixed(2)}` : '-'}
          </td>
          <td className="px-4 py-2 text-zinc-400 text-sm">{p.quantity || 0}</td>
          <td className="px-4 py-2">
            <span className={`inline-block border px-2 py-0.5 text-xs font-bold ${
              p.productState?.toUpperCase() === 'AVAILABLE' ? 'border-green-700 bg-green-950 text-green-400' :
              p.productState?.toUpperCase() === 'HOLD' ? 'border-yellow-700 bg-yellow-950 text-yellow-400' :
              p.productState ? 'border-zinc-700 bg-zinc-800 text-zinc-400' :
              p.status === 'listed' ? 'border-green-700 bg-green-950 text-green-400' :
              p.status === 'hold' ? 'border-yellow-700 bg-yellow-950 text-yellow-400' :
              'border-zinc-700 bg-zinc-800 text-zinc-400'
            }`}>
              {p.productState || p.status || '-'}
            </span>
          </td>
          <td className="px-4 py-2">
            <button
              onClick={(e) => handleDelete(e, p.id)}
              disabled={deleting === p.id}
              className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
              title="Elimina variante"
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
