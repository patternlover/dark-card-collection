'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditProductModal } from '@/components/admin/EditProductModal'
import { ProductGroupRow } from '@/components/admin/ProductGroupRow'
import { groupProducts } from '@/lib/group-products'

interface Product {
  id: number
  title: string
  slug: string
  itemId: string
  description: string | null
  storePrice: number | null
  price: number | null
  compareAtPrice: number | null
  status: string
  condition: string
  language: string
  quantity: number
  imageUrl: string | null
  featured: boolean
  cardNumber: string | null
  rarity: string | null
  category: { id: number; name: string } | null
  collection: { id: number; name: string } | null
}

interface Category { id: number; name: string }
interface Collection { id: number; name: string }

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti' },
  { value: 'listed', label: 'Disponibile' },
  { value: 'hold', label: 'In Attesa' },
  { value: 'sold', label: 'Venduto' },
]

const IMAGE_OPTIONS = [
  { value: '', label: 'Tutti' },
  { value: 'yes', label: 'Con immagine' },
  { value: 'no', label: 'Senza immagine' },
]

export default function AdminProductsPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [collection, setCollection] = useState('')
  const [withImage, setWithImage] = useState('')

  const groups = useMemo(() => groupProducts(products), [products])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '500')
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (category) params.set('category', category)
      if (collection) params.set('collection', collection)
      if (withImage) params.set('withImage', withImage)

      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { 'x-sync-password': password },
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setProducts(data.products)
      setCategories(data.categories)
      setCollections(data.collections)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }, [page, search, status, category, collection, withImage, password])

  useEffect(() => {
    if (authenticated) fetchProducts()
  }, [authenticated, fetchProducts])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(false)
    setAuthenticated(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8">
          <h1 className="text-2xl font-bold text-center">Gestione Prodotti</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border-2 border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#FACC15] focus:outline-none shadow-[3px_3px_0px_0px_#27272a]"
            autoFocus
          />
          {authError && <p className="text-sm text-red-400">Password non valida</p>}
          <button
            type="submit"
            className="w-full border-2 border-[#FACC15] bg-[#FACC15] px-4 py-3 font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-0 active:shadow-none"
          >
            Accedi
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#FACC15] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Gestione Prodotti</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/sync" className="text-sm text-zinc-400 hover:text-[#FACC15] transition-colors">
              Sincronizzazione
            </Link>
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white transition-colors">
              Esci
            </Link>
          </div>
        </div>

        <div className="border-2 border-zinc-800 p-4 mb-6 shadow-[3px_3px_0px_0px_#27272a]">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Cerca</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome o Item ID..."
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#FACC15] focus:outline-none"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Stato</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Categoria</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                <option value="">Tutte</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Collezione</label>
              <select
                value={collection}
                onChange={(e) => { setCollection(e.target.value); setPage(1) }}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                <option value="">Tutte</option>
                {collections.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1 font-medium">Immagine</label>
              <select
                value={withImage}
                onChange={(e) => { setWithImage(e.target.value); setPage(1) }}
                className="w-full border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#FACC15] focus:outline-none"
              >
                {IMAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button
              type="submit"
              className="border-2 border-[#FACC15] bg-[#FACC15] px-4 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:translate-0 active:shadow-none"
            >
              Cerca
            </button>
          </form>
        </div>

        <div className="mb-4 text-sm text-zinc-500 font-medium">
          {total} prodott{total === 1 ? 'o' : 'i'} ({groups.length} {groups.length === 1 ? 'gruppo' : 'gruppi'})
        </div>

        {loading ? (
          <div className="text-center py-16 text-zinc-500">Caricamento...</div>
        ) : (
          <div className="border-2 border-zinc-800 overflow-hidden shadow-[3px_3px_0px_0px_#27272a]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-800 bg-zinc-900 text-left">
                  <th className="px-4 py-3 text-zinc-500 font-medium w-16"></th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Prodotto</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Collezione</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Prezzo</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Qta</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <ProductGroupRow
                    key={group.title}
                    group={group}
                    password={password}
                    onProductUpdated={fetchProducts}
                  />
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                      Nessun prodotto trovato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-2 border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Precedente
            </button>
            <span className="text-sm text-zinc-500">Pagina {page} di {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-2 border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Successiva
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
