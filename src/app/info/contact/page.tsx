import Link from 'next/link'
import { Mail } from 'lucide-react'
import { ContactForm } from '@/components/contact/ContactForm'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')
const CONTACT_EMAIL = 'darkcardcollection@gmail.com'

export const metadata: Metadata = {
  title: 'Contatti | Dark Card Collection',
  description:
    'Contatta Dark Card Collection: assistenza su ordini, spedizioni, resi e prodotti Pokémon TCG. Rispondiamo entro 24 ore lavorative.',
  alternates: {
    canonical: '/info/contact',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contatti - Dark Card Collection',
  url: `${SITE_URL}/info/contact`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Dark Card Collection',
    email: CONTACT_EMAIL,
    url: SITE_URL,
  },
}

export default function ContactPage() {
  return (
    <div className="bg-black">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm font-medium uppercase tracking-wider">
          <ol className="flex flex-wrap items-center gap-x-2 text-zinc-500">
            <li>
              <Link href="/" className="transition-colors hover:text-[var(--accent)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300">Contatti</li>
          </ol>
        </nav>

        <Reveal>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Contattaci</h1>
          <p className="mt-2 text-zinc-400">
            Hai domande? Siamo qui per aiutarti. Compila il form e ti risponderemo entro 24 ore.
          </p>
        </Reveal>

        <div className="mt-8 mb-8 flex items-center gap-4 border-2 border-[var(--accent)] bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_var(--accent)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--accent)]">
            <Mail className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Oppure scrivici direttamente:</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-[var(--accent)] underline underline-offset-2 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  )
}
