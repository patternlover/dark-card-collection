'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message'),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Errore nell\'invio del messaggio.')
        return
      }

      setSuccess(true)
      form.reset()
    } catch {
      setError('Errore di connessione. Riprova piu\' tardi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-4">Contattaci</h1>
        <p className="text-zinc-400 mb-8">
          Hai domande? Siamo qui per aiutarti. Compila il form e ti risponderemo entro 24 ore.
        </p>

        {success && (
          <div className="mb-6 rounded-lg border border-green-800 bg-green-900/30 p-4 text-green-300">
            Messaggio inviato con successo. Ti risponderemo entro 24 ore.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/30 p-4 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-400 mb-2">
              Nome
            </label>
            <input
              type="text"
              id="name"
              name="name"
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
              name="email"
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
              name="subject"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="Come possiamo aiutarti?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm text-zinc-400 mb-2">
              Messaggio
            </label>
            <textarea
              id="message"
              name="message"
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
