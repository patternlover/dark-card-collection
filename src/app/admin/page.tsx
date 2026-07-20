'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database, RefreshCw, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(false)
    setAuthenticated(true)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8">
          <h1 className="text-2xl font-bold text-center">Admin</h1>
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

  const tools = [
    {
      title: 'Gestione Prodotti',
      description: 'Visualizza, modifica ed elimina i prodotti del catalogo.',
      href: '/admin/products',
      icon: Database,
    },
    {
      title: 'Sincronizzazione',
      description: 'Sincronizza i dati da Google Sheets a Payload CMS.',
      href: '/admin/sync',
      icon: RefreshCw,
    },
    {
      title: 'Payload CMS',
      description: 'Pannello di amministrazione nativo di Payload.',
      href: '/admin/[[...segments]]',
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold">Admin</h1>
          <button
            onClick={() => { setAuthenticated(false); setPassword('') }}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Esci
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50"
            >
              <tool.icon className="h-8 w-8 text-zinc-500 group-hover:text-white transition-colors mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">{tool.title}</h2>
              <p className="text-sm text-zinc-500">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
