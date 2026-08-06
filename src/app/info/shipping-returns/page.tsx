import type { Metadata } from 'next'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'Spedizioni e Resi',
  description: 'Informazioni su spedizioni, tempi di consegna e diritto di recesso di Dark Card Collection.',
  alternates: {
    canonical: '/info/shipping-returns',
  },
}

const SHIPPING_COST = '9,99 €'
const FREE_SHIPPING_THRESHOLD = '80,00 €'

export default function ShippingReturnsPage() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-4" items={[{ label: 'Home', href: '/' }, { label: 'Spedizioni e Resi' }]} />
        <Reveal>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-8">Spedizioni e Resi</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Ultimo aggiornamento: 18 luglio 2026
          </p>
        </Reveal>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Spedizioni</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Spediamo esclusivamente sul territorio italiano</li>
              <li>Costo di spedizione: {SHIPPING_COST} per ordine</li>
              <li>Spedizione <strong className="text-white">gratuita</strong> per ordini superiori a {FREE_SHIPPING_THRESHOLD}</li>
              <li>Tempi di consegna indicativi: 1-3 giorni lavorativi dalla conferma dell&apos;ordine</li>
              <li>Tutte le spedizioni sono tracciate e assicurate</li>
              <li>I prodotti vengono imballati con cura per garantire l&apos;integrità durante il trasporto</li>
            </ul>
            <p className="mt-3">
              I tempi di consegna sono puramente indicativi e possono variare in base al corriere
              e alla disponibilità del prodotto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Diritto di recesso</h2>
            <p>
              Ai sensi dell&apos;art. 52 e seguenti del D.Lgs. 206/2005 (Codice del Consumo),
              hai diritto di recedere dal contratto entro <strong className="text-white">14 giorni</strong> dalla
              data di consegna del prodotto, senza dover fornire alcuna motivazione.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Il prodotto deve essere integro e nella confezione originale, mai aperto</li>
              <li>Il diritto di recesso si applica solo ai prodotti <strong className="text-white">sigillati</strong></li>
              <li>Le spese di resa sono a carico del cliente, salvo prodotti difettosi</li>
              <li>Il rimborso viene effettuato entro 14 giorni dalla ricezione del reso, tramite lo stesso metodo di pagamento utilizzato (Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Come esercitare il recesso</h2>
            <p>
              Per esercitare il diritto di recesso, comunicacelo tramite il nostro{' '}
              <a href="/info/contact" className="text-blue-400 underline hover:text-blue-300">
                modulo di contatto
              </a>{' '}
              oppure via email all&apos;indirizzo indicato in fondo al sito, indicando:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Numero dell&apos;ordine</li>
              <li>Prodotto/i per cui intendi recedere</li>
              <li>Data di consegna</li>
            </ul>
            <p className="mt-3">
              Ti forniremo istruzioni su come effettuare il reso. Il prodotto deve essere
              rispedito entro 14 giorni dalla comunicazione del recesso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Prodotti danneggiati o difettosi</h2>
            <p>
              Se il prodotto arriva danneggiato o difettoso, contattaci entro{' '}
              <strong className="text-white">48 ore</strong> dalla consegna tramite il modulo di contatto,
              allegando foto del prodotto e della confezione. Provvederemo alla sostituzione
              o al rimborso completo, incluse le spese di spedizione.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Rimborsi</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>I rimborsi vengono elaborati tramite Stripe sullo stesso metodo di pagamento</li>
              <li>Tempi di rimborso: entro 14 giorni dalla ricezione del reso</li>
              <li>Il rimborso può richiedere alcuni giorni lavorativi per essere visibile sul conto, in base alla tua banca</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contattaci</h2>
            <p>
              Per qualsiasi domanda su spedizioni e resi, puoi contattarci tramite il nostro{' '}
              <a href="/info/contact" className="text-blue-400 underline hover:text-blue-300">
                modulo di contatto
              </a>{' '}
              o all&apos;indirizzo email indicato in fondo al sito.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
