import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

export const metadata: Metadata = {
  title: 'Come Scegliere un Booster Box Pokémon | Guida',
  description:
    'Guida ai booster box Pokémon TCG: quante bustine contengono, come leggere il prezzo di mercato e quando convengono rispetto alle bustine singole.',
  alternates: {
    canonical: '/guide/come-scegliere-booster-box',
  },
}

const faqs = [
  {
    question: 'Quante bustine contiene un booster box Pokémon?',
    answer:
      'Un booster box Pokémon contiene in genere 36 bustine, ognuna con 10 carte. Esistono anche box più piccoli (come i booster bundle) con 6 bustine.',
  },
  {
    question: 'Quanto costa un booster box Pokémon?',
    answer:
      'Il prezzo di un booster box varia in base all\u2019espansione: i set più recenti si trovano tra 90 e 120 €, mentre set più vecchi o introvabili possono costare molto di più. Controlla sempre il prezzo medio di mercato.',
  },
  {
    question: 'Conviene comprare il booster box o le bustine singole?',
    answer:
      'Se vuoi aprire molte bustine di una stessa espansione, il booster box conviene: il costo per bustina è molto più basso. Se cerchi carte specifiche, le singole sono più economiche nel lungo periodo.',
  },
  {
    question: 'Come verificare che un booster box sia sigillato?',
    answer:
      'Controlla la pellicola termoretraibile integra, i sigilli con il logo e l\u2019assenza di tagli o riaperture. Comprando da negozi autorizzati che vendono solo sigillato, il rischio è minimo.',
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

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Guide', item: `${SITE_URL}/guide` },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Come scegliere un booster box',
      item: `${SITE_URL}/guide/come-scegliere-booster-box`,
    },
  ],
}

export default function GuideBoosterBoxPage() {
  return (
    <div className="bg-black">
      <JsonLd data={[jsonLd, breadcrumbJsonLd]} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm font-medium uppercase tracking-wider">
          <ol className="flex flex-wrap items-center gap-x-2 text-zinc-500">
            <li>
              <Link href="/" className="transition-colors hover:text-[#FACC15]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/guide" className="transition-colors hover:text-[#FACC15]">
                Guide
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300">Booster box</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Come scegliere un booster box Pokémon
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-300">
          Un booster box Pokémon contiene in genere 36 bustine sigillate di una singola
          espansione. È la scelta migliore se vuoi aprire tante bustine a costo unitario
          ridotto: il prezzo per bustina è molto più basso rispetto all\u2019acquisto singolo.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">
          Booster box: cosa c\u2019è dentro
        </h2>
        <table className="mt-4 w-full border-collapse text-sm text-zinc-400">
          <thead>
            <tr className="border-b-2 border-zinc-700 text-left text-zinc-200">
              <th className="py-2 pr-4">Prodotto</th>
              <th className="py-2 pr-4">Bustine</th>
              <th className="py-2">Costo per bustina</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4">Booster box</td>
              <td className="py-2 pr-4">36</td>
              <td className="py-2">Basso (migliore)</td>
            </tr>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4">Booster bundle</td>
              <td className="py-2 pr-4">6</td>
              <td className="py-2">Medio</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Bustine singole</td>
              <td className="py-2 pr-4">1</td>
              <td className="py-2">Alto</td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-10 text-xl font-bold text-white">
          Come valutare il prezzo
        </h2>
        <p className="mt-4 text-zinc-400">
          Il prezzo di un booster box dipende dall\u2019espansione, non dal costo di listino del
          singolo prodotto. I set più recenti e stampati in grande quantità costano meno; le
          espansioni più vecchie o con alta domanda salgono. Confronta sempre con il prezzo
          medio di vendita indicato nella scheda prodotto.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">Quando conviene un booster box</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-400">
          <li>Vuoi aprire molte bustine della stessa espansione.</li>
          <li>Vuoi completare un set e hai bisogno di molte carte comuni.</li>
          <li>Vuoi collezionare da sigillato e rivendere in futuro.</li>
          <li>Cerchi il costo per bustina più basso possibile.</li>
        </ul>

        <div className="mt-10 rounded-lg border-2 border-[#FACC15] bg-zinc-900 p-6">
          <h2 className="text-lg font-bold text-white">I booster box in vendita</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Vedi i booster box disponibili nelle nostre collezioni, sigillati e originali.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="border-2 border-[#FACC15] bg-[#FACC15] px-5 py-2 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
            >
              Vai allo Shop
            </Link>
            <Link
              href="/shop/collections"
              className="border-2 border-zinc-600 px-5 py-2 text-sm font-black uppercase tracking-wide text-white transition-colors hover:border-[#FACC15] hover:text-[#FACC15]"
            >
              Le Collezioni
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-bold uppercase tracking-tight text-white">
          Domande frequenti
        </h2>
        <div className="mt-4 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="font-medium text-white">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
          <p>Altre guide:</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/guide/dove-comprare-carte-pokemon-originali"
              className="text-[#FACC15] hover:text-white"
            >
              Dove comprare carte Pokémon originali →
            </Link>
            <Link href="/guide/etb-cosa-sono-elite-trainer-box" className="text-[#FACC15] hover:text-white">
              Cosa sono le ETB →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
