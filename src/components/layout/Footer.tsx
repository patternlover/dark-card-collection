import Link from 'next/link'
import { CreditCard, Truck } from 'lucide-react'

// TODO: sostituire con i dati aziendali reali (obbligatori per Stripe e per legge)
const BUSINESS = {
  legalName: 'Nome e Cognome (o Ragione Sociale)',
  address: 'Via Esempio 1, 00000 Città (RM), Italia',
  email: 'info@darkcardcollection.com',
  taxId: 'CF / P.IVA — da compilare',
}

const shopLinks = [
  { label: 'Catalogo', href: '/shop' },
  { label: 'Collezioni', href: '/shop/collections' },
  { label: 'Bestseller', href: '/shop/bestsellers' },
  { label: 'Novità', href: '/shop/new-arrivals' },
  { label: 'In Attesa', href: '/shop/preorders' },
]

const infoLinks = [
  { label: 'Chi Siamo', href: '/info/about' },
  { label: 'FAQ', href: '/info/faq' },
  { label: 'Contatti', href: '/info/contact' },
  { label: 'Carrello', href: '/cart' },
]

const legalLinks = [
  { label: 'Privacy', href: '/info/privacy' },
  { label: 'Termini', href: '/info/terms' },
  { label: 'Spedizioni e Resi', href: '/info/shipping-returns' },
  { label: 'Contatti', href: '/info/contact' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black tracking-tight text-[#FACC15]">
                DARK CARD
              </span>
              <span className="text-xl font-light text-[#FACC15]">
                {' '}COLLECTION
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Negozio specializzato in prodotti Pokémon TCG sigillati.
              Booster Box, ETB, Collection Box e SPC.
            </p>
            <div className="mt-4 space-y-1 text-xs text-zinc-600">
              <p>{BUSINESS.legalName}</p>
              <p>{BUSINESS.address}</p>
              <p>{BUSINESS.taxId}</p>
              <p>
                <a href={`mailto:${BUSINESS.email}`} className="transition-colors hover:text-[#FACC15]">
                  {BUSINESS.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="mt-3 space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Informazioni
            </h3>
            <ul className="mt-3 space-y-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Acquista in sicurezza
            </h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm text-zinc-500">
                <CreditCard className="h-4 w-4 text-[#FACC15]" />
                Pagamenti sicuri con Stripe
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-500">
                <Truck className="h-4 w-4 text-[#FACC15]" />
                Spedizione gratuita sopra 100 €
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-black bg-[#FACC15]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-5 lg:flex-row lg:justify-between">
            <p className="text-2xl font-black uppercase leading-none tracking-tight text-black lg:text-3xl">
              Dark Card
              <span className="font-light"> Collection</span>
            </p>

            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs font-bold uppercase tracking-wide text-black/70 transition-colors hover:text-black"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="text-xs font-semibold text-black/60">
              © {currentYear} Dark Card Collection
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
