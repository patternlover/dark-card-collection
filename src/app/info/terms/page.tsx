import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termini e Condizioni',
  description: 'Termini e condizioni di utilizzo e di vendita di Dark Card Collection.',
}

export default function TermsPage() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Termini e Condizioni</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Ultimo aggiornamento: 18 luglio 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Accettazione dei termini</h2>
            <p>
              Accedendo e utilizzando il sito dark-card-collection.vercel.app (&quot;Sito&quot;),
              accetti integralmente i presenti Termini e Condizioni. Se non sei d&apos;accordo
              con qualcuno di questi termini, ti preghiamo di non utilizzare il Sito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Oggetto</h2>
            <p>
              Il Sito &egrave; un negozio online specializzato nella vendita di prodotti
              Pokémon Trading Card Game (TCG) sigillati, incluse ma non limitate a: Booster Box,
              Elite Trainer Box (ETB), Collection Box, Special Premium Collection (SPC) e altri
              prodotti correlati.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Prodotti e prezzi</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tutti i prodotti sono originali e sigillati, salvo diversa indicazione</li>
              <li>I prezzi sono indicati in euro (EUR) e includono l&apos;IVA ove applicabile</li>
              <li>ci riserviamo il diritto di modificare i prezzi in qualsiasi momento, senza preavviso</li>
              <li>Le immagini dei prodotti sono indicative e possono non essere perfettamente rappresentative</li>
              <li>La disponibilit&agrave; dei prodotti &egrave; soggetta a variabilit&agrave;</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Ordini e pagamento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>L&apos;ordine si considera accettato solo dopo conferma email</li>
              <li>I pagamenti vengono elaborati tramite Stripe in modo sicuro e crittografato</li>
              <li>Accettiamo le principali carte di credito e debito</li>
              <li>In caso di pagamento non andato a buon fine, l&apos;ordine non verra&apos; processato</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Spedizione</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le spedizioni vengono effettuate sul territorio italiano (eventualmente UE in futuro)</li>
              <li>I tempi di spedizione sono indicativi e possono variare</li>
              <li>Il rischio di perdita o danneggiamento del prodotto passa al cliente al momento della consegna</li>
              <li>Verifica la merce al momento della consegna e segnala eventuali danni entro 48 ore</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Diritto di recesso</h2>
            <p>
              Ai sensi del D.Lgs. 21/2014, hai diritto di recedere dal contratto entro 14 giorni
              dalla consegna del prodotto, senza alcun motivo. Il prodotto deve essere integro e
              nella sua confezione originale. Le spese di resa sono a carico del cliente.
            </p>
            <p className="mt-2">
              Il diritto di recesso si applica solo ai prodotti sigillati. Per i prodotti aperti
              o utilizzati, il recesso non &egrave; previsto salvo vizi difettosi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Garanzia</h2>
            <p>
              Tutti i prodotti sono coperti dalla garanzia legale di conformit&agrave; di 24 mesi
              (D.Lgs. 24/2002). In caso di vizio, hai diritto alla riparazione o sostituzione
              del prodotto, o al rimborso integrale del prezzo pagato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Responsabilit&agrave;</h2>
            <p>
              Dark Card Collection non &egrave; responsabile per:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Danni derivanti dall&apos;uso improprio dei prodotti</li>
              <li>Indisponibilit&agrave; temporanea del sito per manutenzione</li>
              <li>Errori nei prezzi o nelle descrizioni dei prodotti (salvo errore grossolano)</li>
              <li>Ritardi nella consegca attribuibili al corriere</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Propriet&agrave; intellettuale</h2>
            <p>
              Tutti i contenuti del Sito (testi, immagini, logo, grafiche) sono di nostra
              propriet&agrave; o utilizzati con licenza. &Egrave; vietata la riproduzione,
              distribuzione o modifica senza autorizzazione scritta.
            </p>
            <p className="mt-2">
              Pokémon &egrave; un marchio registrato di The Pokémon Company. Questo sito non &egrave;
              affiliato, sponsorizzato o approvato da The Pokémon Company.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Legge applicabile</h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia
              sar&agrave; competente il Foro di [Citt&agrave;], Italia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Modifiche</h2>
            <p>
              Ci riserviamo il diritto di modificare questi Termini in qualsiasi momento.
              Le modifiche saranno effettive dalla data di pubblicazione sul Sito.
              L&apos;uso continuato del Sito dopo le modifiche costituisce accettazione
              dei nuovi Termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contattaci</h2>
            <p>
              Per domande relative ai presenti Termini, contattaci tramite il nostro{' '}
              <a href="/info/contact" className="text-blue-400 underline hover:text-blue-300">
                modulo di contatto
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
