import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ Pokémon TCG | Spedizioni, Resi, Autenticità',
  description:
    'Risposte su autenticità dei prodotti, spedizione gratuita dagli 80 €, resi in 14 giorni e preordini Pokémon TCG. Contattaci per qualsiasi dubbio.',
  alternates: {
    canonical: '/info/faq',
  },
}

const faqs = [
  {
    question: 'I prodotti sono originali?',
    answer:
      'Sì, tutti i nostri prodotti sono originali e sigillati. Acquistiamo direttamente dai distributori ufficiali per garantire l\u2019autenticità di ogni articolo. Se hai dubbi su un prodotto, contattaci prima di ordinare.',
  },
  {
    question: 'Come funziona la spedizione?',
    answer:
      'Spediamo in tutta Italia con corrieri tracciabili. La spedizione è gratuita per ordini dagli 80 €, altrimenti costa 9,99 €. Una volta spedito, riceverai un codice di tracciamento via email.',
  },
  {
    question: 'Quanto tempo impiega la consegna?',
    answer:
      'Gli ordini vengono preparati entro 24 ore lavorative e la consegna avviene in genere in 2-4 giorni lavorativi dal ritiro del corriere, a seconda della destinazione.',
  },
  {
    question: 'Posso restituire un prodotto?',
    answer:
      'Sì, puoi restituire un prodotto entro 14 giorni dalla ricezione, a condizione che sia sigillato e nelle condizioni originali. Contattaci per avviare la procedura di reso.',
  },
  {
    question: 'Come funzionano i preordini?',
    answer:
      'I preordini ti permettono di riservare i prodotti prima della loro uscita ufficiale. Paghi al momento del preordine e ricevi il prodotto non appena sarà disponibile.',
  },
  {
    question: 'Quali metodi di pagamento accettate?',
    answer:
      'Accettiamo carte di credito, debito e altri metodi di pagamento tramite Stripe, il nostro partner per i pagamenti sicuri.',
  },
  {
    question: 'Come riconosco un booster box sigillato originale?',
    answer:
      'Un booster box originale presenta la pellicola termoretraibile integra, il codice colore del blister e la scatola con loghi e codici ufficiali. Noi vendiamo solo prodotti sigillati acquistati da distributori autorizzati.',
  },
  {
    question: 'Fate spedizioni fuori dall\u2019Italia?',
    answer:
      'Attualmente spediamo esclusivamente in Italia. In futuro valuteremo l\u2019espansione all\u2019Unione Europea.',
  },
  {
    question: 'Come posso contattarvi?',
    answer:
      'Puoi contattarci tramite il form nella pagina Contatti, oppure via email a darkcardcollection@gmail.com. Rispondiamo entro 24 ore lavorative.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function FAQPage() {
  return (
    <div className="bg-black">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm font-medium uppercase tracking-wider">
          <ol className="flex flex-wrap items-center gap-x-2 text-zinc-500">
            <li>
              <Link href="/" className="transition-colors hover:text-[#FACC15]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300">FAQ</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Domande Frequenti
        </h1>
        <p className="mt-2 text-zinc-400">
          Le risposte alle domande più comuni su autenticità, spedizioni, resi e preordini.
        </p>

        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-lg border border-zinc-800 bg-zinc-900/50"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 font-medium text-white list-none">
                <span>{faq.question}</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-zinc-700 text-zinc-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-zinc-400">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 border-2 border-[#FACC15] bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#FACC15]">
          <h2 className="text-lg font-bold text-white">Hai ancora domande?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Scrivici: rispondiamo entro 24 ore lavorative.
          </p>
          <Link
            href="/info/contact"
            className="mt-4 inline-block border-2 border-[#FACC15] bg-[#FACC15] px-6 py-2.5 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
          >
            Contattaci
          </Link>
        </div>
      </div>
    </div>
  )
}
