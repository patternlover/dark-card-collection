import Link from 'next/link'

// TODO: sostituire con i dati aziendali reali (obbligatori per Stripe e per legge)
const BUSINESS = {
  legalName: 'Nome e Cognome (o Ragione Sociale)',
  address: 'Via Esempio 1, 00000 Città (RM), Italia',
  email: 'info@darkcardcollection.com',
  taxId: 'CF / P.IVA — da compilare',
}

const legalLinks = [
  { label: 'Privacy', href: '/info/privacy' },
  { label: 'Termini', href: '/info/terms' },
  { label: 'Spedizioni e Resi', href: '/info/shipping-returns' },
  { label: 'Contatti', href: '/info/contact' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-zinc-700 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black tracking-tight text-white">
                DARK CARD
              </span>
              <span className="text-xl font-light text-[#FACC15]">
                {' '}COLLECTION
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              Negozio specializzato in prodotti Pokémon TCG sigillati.
              Booster Box, ETB, Collection Box e SPC.
            </p>
            <div className="mt-6 space-y-1 text-xs text-zinc-600">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/shop" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Catalogo
                </Link>
              </li>
              <li>
                <Link href="/shop/collections" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Collezioni
                </Link>
              </li>
              <li>
                <Link href="/shop/bestsellers" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Bestseller
                </Link>
              </li>
              <li>
                <Link href="/shop/new-arrivals" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Novità
                </Link>
              </li>
              <li>
                <Link href="/shop/preorders" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  In Attesa
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Informazioni
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/info/about" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link href="/info/faq" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/info/contact" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Contatti
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Carrello
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-2 border-zinc-800 pt-6 text-xs text-zinc-600 sm:flex-row">
          <p>&copy; {currentYear} Dark Card Collection. Tutti i diritti riservati.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {legalLinks.map((link, i) => (
              <span key={link.href} className="flex items-center gap-3">
                {i > 0 && <span className="text-zinc-700">|</span>}
                <Link href={link.href} className="transition-colors hover:text-[#FACC15]">
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
