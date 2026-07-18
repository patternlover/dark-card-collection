import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ordine Completato',
  description: 'Il tuo ordine è stato registrato con successo.',
}

export default function CheckoutSuccessPage() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-white mb-4">
          Ordine confermato!
        </h1>

        <p className="text-zinc-400 mb-8">
          Grazie per il tuo ordine. Riceverai una email di conferma a breve.
        </p>

        <div className="rounded-lg border border-zinc-800 p-6 mb-8 text-left">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">
            Prossimi passi
          </h2>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li>• Riceverai una email con i dettagli dell&apos;ordine</li>
            <li>• Il tuo ordine verrà elaborato entro 24 ore</li>
            <li>• Riceverai il codice di tracciamento appena spedito</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Continua lo shopping
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-white hover:border-zinc-500"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  )
}
