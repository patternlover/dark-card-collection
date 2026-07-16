export default function AboutPage() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Chi Siamo</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p>
            Dark Card Collection è un negozio specializzato nella vendita di prodotti
            Pokémon TCG sigillati. La nostra passione per il collezionismo ci ha spinto
            a creare uno spazio dove trovare prodotti originali e di qualità.
          </p>

          <h2 className="text-xl font-semibold text-white">La Nostra Missione</h2>
          <p>
            Offrire ai collezionisti e agli appassionati di Pokémon TCG un luogo affidabile
            dove acquistare prodotti sigillati con sicurezza. Ogni prodotto che vendiamo è
            originale, sigillato e trattato con la massima cura.
          </p>

          <h2 className="text-xl font-semibold text-white">Cosa Ci Rende Speciali</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Prodotti 100% originali e sigillati</li>
            <li>Spedizione tracciabile e sicura</li>
            <li>Packaging professionale per proteggere ogni ordine</li>
            <li>Supporto clienti dedicato e reattivo</li>
            <li>Consegna rapida in tutta Italia</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Il Nostro Magazzino</h2>
          <p>
            Tutti i nostri prodotti sono conservati in condizioni ottimali per garantire
            che arrivino da te nelle migliori condizioni possibili. Utilizziamo materiali
            di alta qualità per il packaging e la spedizione.
          </p>
        </div>
      </div>
    </div>
  )
}
