import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'

const faqs = [
  {
    question: 'I prodotti sono originali?',
    answer:
      'Sì, tutti i nostri prodotti sono originali e sigillati. Acquistiamo direttamente dai distributori ufficiali per garantire l\u2019autenticità di ogni articolo.',
  },
  {
    question: 'Come funziona la spedizione?',
    answer:
      'Spediamo in tutta Italia con corrieri tracciabili. La spedizione è gratuita per ordini dagli 80 €, altrimenti costa 9,99 €.',
  },
  {
    question: 'Posso restituire un prodotto?',
    answer:
      'Sì, puoi restituire un prodotto entro 14 giorni dalla ricezione, a condizione che sia sigillato e nelle condizioni originali.',
  },
  {
    question: 'Come funzionano i preordini?',
    answer:
      'I preordini ti permettono di riservare i prodotti prima della loro uscita ufficiale. Paghi al momento del preordine e ricevi il prodotto appena disponibile.',
  },
]

export function HomepageFaq() {
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

  return (
    <section className="border-t-2 border-zinc-800 bg-black py-16">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Domande Frequenti</h2>
          <Link
            href="/info/faq"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Tutte le FAQ →
          </Link>
        </div>

        <dl className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <dt className="font-medium text-white">{faq.question}</dt>
              <dd className="mt-2 text-sm text-zinc-400">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
