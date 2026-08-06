import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'ETB: Cosa Sono le Elite Trainer Box Pokémon | Guida',
  description:
    'Scopri cosa contiene una Elite Trainer Box (ETB) Pokémon TCG: bustine, carte promozionali, dadi e accessori. Prezzi e a chi conviene rispetto al booster box.',
  alternates: {
    canonical: '/guide/etb-cosa-sono-elite-trainer-box',
  },
}

const faqs = [
  {
    question: 'Cosa contiene una Elite Trainer Box Pokémon?',
    answer:
      'Una Elite Trainer Box (ETB) contiene in genere 8-9 bustine di una espansione, una carta promozionale foil esclusiva, dadi per i segni-danno, segnalini status, una pellicola per il dado e una scatola da collezione.',
  },
  {
    question: 'Quanto costa una Elite Trainer Box?',
    answer:
      'Il prezzo di una ETB varia in base all\u2019espansione e alla disponibilità, di solito tra 40 e 60 € per i set recenti. Le espansioni più richieste possono valere di più.',
  },
  {
    question: 'ETB o booster box: cosa conviene?',
    answer:
      'Per massimizzare il numero di bustine conviene il booster box (36 bustine). L\u2019ETB conviene se vuoi la carta promozionale esclusiva, gli accessori da gioco e una scatola da collezione.',
  },
  {
    question: 'Le carte promozionali delle ETB sono esclusive?',
    answer:
      'Sì, ogni ETB include una carta promozionale foil esclusiva stampata per quella espansione, spesso tra le carte più ricercate dai collezionisti.',
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
      name: 'Cosa sono le Elite Trainer Box',
      item: `${SITE_URL}/guide/etb-cosa-sono-elite-trainer-box`,
    },
  ],
}

export default function GuideEtbPage() {
  return (
    <div className="bg-black">
      <JsonLd data={[jsonLd, breadcrumbJsonLd]} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Guide', href: '/guide' },
            { label: 'Elite Trainer Box' },
          ]}
        />

        <Reveal>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            ETB: cosa sono le Elite Trainer Box Pokémon
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            L’Elite Trainer Box (ETB) è il kit ufficiale per allenatori e collezionisti del
            Pokémon TCG: contiene bustine dell’espansione, una carta promozionale foil
            esclusiva e gli accessori da gioco. Costa meno di un booster box ma offre contenuti
            che il box non ha.
          </p>
        </Reveal>

        <h2 className="mt-10 text-xl font-bold text-white">Cosa c’è dentro una ETB</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-400">
          <li>8-9 bustine dell’espansione della collezione</li>
          <li>1 carta promozionale foil esclusiva</li>
          <li>65 segna-danni, dadi e segnalini status</li>
          <li>1 pellicola per il dado (sleeve)</li>
          <li>1 scatola rigida da collezione con divisori</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold text-white">ETB o booster box?</h2>
        <table className="mt-4 w-full border-collapse text-sm text-zinc-400">
          <thead>
            <tr className="border-b-2 border-zinc-700 text-left text-zinc-200">
              <th className="py-2 pr-4">Caratteristica</th>
              <th className="py-2 pr-4">ETB</th>
              <th className="py-2">Booster box</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4">Bustine</td>
              <td className="py-2 pr-4">8-9</td>
              <td className="py-2">36</td>
            </tr>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4">Carta promozionale</td>
              <td className="py-2 pr-4">Sì, esclusiva</td>
              <td className="py-2">No</td>
            </tr>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4">Accessori da gioco</td>
              <td className="py-2 pr-4">Sì</td>
              <td className="py-2">No</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Prezzo indicativo</td>
              <td className="py-2 pr-4">40-60 €</td>
              <td className="py-2">90-120 €</td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-10 text-xl font-bold text-white">A chi conviene una ETB</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-400">
          <li>Vuoi la carta promozionale esclusiva della collezione.</li>
          <li>Giochi e ti servono dadi e segna-danni.</li>
          <li>Vuoi una scatola rigida per ordinare la collezione.</li>
          <li>Vuoi provare un’espansione senza comprare 36 bustine.</li>
        </ul>

        <div className="mt-10 rounded-lg border-2 border-[var(--accent)] bg-zinc-900 p-6">
          <h2 className="text-lg font-bold text-white">Le ETB in vendita</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Scopri le Elite Trainer Box disponibili, sigillate e originali.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="border-2 border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
            >
              Vai allo Shop
            </Link>
            <Link
              href="/shop/collections"
              className="border-2 border-zinc-600 px-5 py-2 text-sm font-black uppercase tracking-wide text-white transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
              className="text-[var(--accent)] hover:text-white"
            >
              Dove comprare carte Pokémon originali →
            </Link>
            <Link href="/guide/come-scegliere-booster-box" className="text-[var(--accent)] hover:text-white">
              Come scegliere un booster box →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
