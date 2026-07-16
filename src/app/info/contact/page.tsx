'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: Implement contact form
    console.log('Contact form submitted')
    setIsSubmitting(false)
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-4">Contattaci</h1>
        <p className="text-zinc-400 mb-8">
          Hai domande? Siamo qui per aiutarti. Compila il form e ti risponderemo entro 24 ore.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-400 mb-2">
              Nome
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="Il tuo nome"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="la-tua@email.com"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm text-zinc-400 mb-2">
              Oggetto
            </label>
            <input
              type="text"
              id="subject"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="Come posiamo aiutarti?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm text-zinc-400 mb-2">
              Messaggio
            </label>
            <textarea
              id="message"
              required
              rows={5}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Scrivi il tuo messaggio qui..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Invio in corso...' : 'Invia messaggio'}
          </button>
        </form>
      </div>
    </div>
  )
}
