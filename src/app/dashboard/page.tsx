'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database, RefreshCw, Settings, ArrowLeft } from 'lucide-react'

export default function DashboardPage() {
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
          <h1 className="text-2xl font-black text-center uppercase tracking-tight">Dashboard</h1>
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
      href: '/admin',
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tight">Dashboard</h1>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#FACC15] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[3px_3px_0px_0px_#27272a] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#FACC15] hover:shadow-[5px_5px_0px_0px_#FACC15]"
            >
              <tool.icon className="h-8 w-8 text-zinc-500 group-hover:text-[#FACC15] transition-colors mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">{tool.title}</h2>
              <p className="text-sm text-zinc-500">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
