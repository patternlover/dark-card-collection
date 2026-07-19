'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { proxyImageUrl } from '@/lib/proxy-image'

interface Product {
  id: number
  title: string
  slug: string
  itemId: string
  status: string
  condition: string
  storePrice: number
  price: number
  imageUrl: string | null
  language: string
  quantity: number
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

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            autoFocus
          />
          {authError && <p className="text-sm text-red-400">Password non valida</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black px-4 py-3 font-medium hover:bg-zinc-200 transition-colors"
          >
            Accedi
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Gestione Prodotti</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/sync" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sincronizzazione
            </Link>
            <button
              onClick={() => { setAuthenticated(false); setPassword(''); setProducts([]) }}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Esci
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-zinc-500 mb-1">Cerca</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome o Item ID..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1">Stato</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              >
                <option value="">Tutte</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1">Collezione</label>
              <select
                value={collection}
                onChange={(e) => { setCollection(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              >
                <option value="">Tutte</option>
                {collections.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-zinc-500 mb-1">Immagine</label>
              <select
                value={withImage}
                onChange={(e) => { setWithImage(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              >
                {IMAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Cerca
            </button>
          </form>
        </div>

        <div className="mb-4 text-sm text-zinc-500">
          {total} prodott{total === 1 ? 'o' : 'i'} trovati
        </div>

        {loading ? (
          <div className="text-center py-16 text-zinc-500">Caricamento...</div>
        ) : (
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 text-zinc-500 font-medium w-16"></th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Prodotto</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Item ID</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Collezione</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Prezzo</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Stato</th>
                  <th className="px-4 py-3 text-zinc-500 font-medium">Lingua</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      {proxyImageUrl(p.imageUrl) ? (
                        <img
                          src={proxyImageUrl(p.imageUrl)!}
                          alt={p.title}
                          className="h-10 w-10 rounded object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                          -
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/products/${p.slug}`} className="text-white hover:text-zinc-300 transition-colors">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{p.itemId}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.collection?.name || '-'}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {p.storePrice > 0 ? `€${p.storePrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'listed' ? 'bg-green-900/50 text-green-400' :
                        p.status === 'hold' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {p.status === 'listed' ? 'Disponibile' : p.status === 'hold' ? 'In Attesa' : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{p.language || '-'}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
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
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Precedente
            </button>
            <span className="text-sm text-zinc-500">Pagina {page} di {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Successiva
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
