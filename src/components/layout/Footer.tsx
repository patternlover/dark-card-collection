import Link from 'next/link'

const footerLinks = {
  shop: [
    { label: 'Tutti i prodotti', href: '/shop' },
    { label: 'Collezioni', href: '/shop/collections' },
  ],
  info: [
    { label: 'Chi siamo', href: '/info/about' },
    { label: 'FAQ', href: '/info/faq' },
    { label: 'Contatti', href: '/info/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/info/privacy' },
    { label: 'Termini e Condizioni', href: '/info/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight text-white">
                Dark Card
              </span>
              <span className="text-xl font-light text-zinc-400">
                {' '}Collection
              </span>
            </Link>
            <p className="mt-4 text-sm text-zinc-500">
              Negozio specializzato in prodotti Pokémon TCG sigillati.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Informazioni
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Garanzie
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>Pagamento sicuro con Stripe</li>
              <li>Spedizione tracciabile</li>
              <li>Prodotti 100% originali</li>
              <li>Supporto clienti dedicato</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Legale
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-600">
          <p>&copy; {new Date().getFullYear()} Dark Card Collection. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}
