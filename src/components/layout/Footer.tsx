import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-zinc-700 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black tracking-tight text-white">
                DARK CARD
              </span>
              <span className="text-xl font-light text-[#FACC15]">
                {' '}COLLECTION
              </span>
            </Link>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
              Negozio specializzato in prodotti Pokémon TCG sigillati.
              Booster Box, ETB, Collection Box e SPC.
            </p>
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

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Legale
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/info/privacy" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/info/terms" className="text-sm text-zinc-500 transition-colors hover:text-[#FACC15]">
                  Termini e Condizioni
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t-2 border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>&copy; {currentYear} Dark Card Collection. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-4">
            <Link href="/info/privacy" className="hover:text-[#FACC15] transition-colors">
              Privacy
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/info/terms" className="hover:text-[#FACC15] transition-colors">
              Termini
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/info/contact" className="hover:text-[#FACC15] transition-colors">
              Contatti
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
