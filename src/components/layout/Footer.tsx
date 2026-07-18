import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand + Descrizione */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight text-white">
                Dark Card
              </span>
              <span className="text-xl font-light text-zinc-400">
                {' '}Collection
              </span>
            </Link>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
              Negozio specializzato in prodotti Pokémon TCG sigillati.
              Booster Box, ETB, Collection Box e SPC.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/shop" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Catalogo
                </Link>
              </li>
              <li>
                <Link href="/shop/collections" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Collezioni
                </Link>
              </li>
              <li>
                <Link href="/shop/bestsellers" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Bestseller
                </Link>
              </li>
              <li>
                <Link href="/shop/new-arrivals" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Novit&agrave;
                </Link>
              </li>
              <li>
                <Link href="/shop/preorders" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  In Attesa
                </Link>
              </li>
            </ul>
          </div>

          {/* Informazioni */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Informazioni
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/info/about" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link href="/info/faq" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/info/contact" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Contatti
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Carrello
                </Link>
              </li>
            </ul>
          </div>

          {/* Legale */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Legale
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/info/privacy" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/info/terms" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  Termini e Condizioni
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>&copy; {currentYear} Dark Card Collection. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-4">
            <Link href="/info/privacy" className="hover:text-zinc-400 transition-colors">
              Privacy
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/info/terms" className="hover:text-zinc-400 transition-colors">
              Termini
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/info/contact" className="hover:text-zinc-400 transition-colors">
              Contatti
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
