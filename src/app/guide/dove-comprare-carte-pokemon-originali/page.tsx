import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { Reveal } from '@/components/ui/Reveal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Dove Comprare Carte Pokémon Originali | Guida',
  description:
    'Come riconoscere carte Pokémon originali e dove comprarle online senza rischi: booster box, ETB e bustine sigillate. Spedizione gratuita in Italia dagli 80 €.',
  alternates: {
    canonical: '/guide/dove-comprare-carte-pokemon-originali',
  },
}

const faqs = [
  {
    question: 'Dove comprare carte Pokémon originali online?',
    answer:
      'Il modo più sicuro è acquistare da negozi specializzati autorizzati, meglio se dedicati solo al Pokémon TCG, che vendono prodotti sigillati con imballaggio professionale. Evita venditori senza recensioni o con prezzi molto sotto il mercato.',
  },
  {
    question: 'Come riconoscere un booster box originale?',
    answer:
      'Un booster box originale ha la pellicola termoretraibile integra, il codice colore sul blister, loghi e codici stampati in modo nitido e i sigilli a cialda con il logo. Se la pellicola è rovinata o le stampe sono sfocate, probabilmente non è originale.',
  },
  {
    question: 'I prodotti sigillati si possono contraffare?',
    answer:
      'Sì, esistono bustine sigillate contraffatte. Per questo conviene comprare solo da negozi che acquistano direttamente dai distributori autorizzati e che espongono garanzie di autenticità, come Dark Card Collection.',
  },
  {
    question: 'Quanto costa la spedizione di carte Pokémon?',
    answer:
      'In Italia la spedizione costa 9,99 € ed è gratuita per ordini dagli 80 €. I prodotti viaggiano in packaging rigido e protetto.',
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
      name: 'Dove comprare carte Pokémon originali',
      item: `${SITE_URL}/guide/dove-comprare-carte-pokemon-originali`,
    },
  ],
}

export default function GuideDoveComprarePage() {
  return (
    <div className="bg-black">
      <JsonLd data={[jsonLd, breadcrumbJsonLd]} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Guide', href: '/guide' },
            { label: 'Dove comprare' },
          ]}
        />

        <Reveal>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Dove comprare carte Pokémon originali
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            Per comprare carte Pokémon originali online il modo più sicuro è rivolgersi a negozi
            specializzati che vendono prodotti sigillati acquistati da distributori autorizzati,
            con imballaggio protetto e spedizione tracciabile. Diffida dei prezzi molto sotto il
            mercato e dei venditori senza recensioni.
          </p>
        </Reveal>

        <h2 className="mt-10 text-xl font-bold text-white">
          Cosa controllare prima di comprare
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-400">
          <li>Il venditore vende solo Pokémon TCG o è specializzato in TCG?</li>
          <li>I prodotti sono sigillati e con foto reali?</li>
          <li>Ci sono recensioni verificate e una pagina contatti?</li>
          <li>Il prezzo è in linea con il prezzo medio di mercato?</li>
          <li>L’imballaggio protegge la scatola (cartone rigido)?</li>
          <li>La spedizione è tracciabile e assicurata?</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold text-white">
          I canali migliori in Italia
        </h2>
        <p className="mt-4 text-zinc-400">
          I canali più affidabili per comprare carte Pokémon sigillate sono i negozi specializzati
          online e i rivenditori autorizzati locali. Le piattaforme di annunci o i marketplace aperti
          vanno usati con cautela: la contraffazione di bustine sigillate esiste, quindi controlla
          sempre il seller rating e chiedi foto reali del prodotto.
        </p>

        <div className="mt-10 rounded-lg border-2 border-[var(--accent)] bg-zinc-900 p-6">
          <h2 className="text-lg font-bold text-white">Compralo da Dark Card Collection</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Vendiamo solo Pokémon TCG sigillati da distributori autorizzati, con packaging
            professionale e spedizione gratuita dagli 80 €.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="border-2 border-[var(--accent)] bg-[var(--accent)] px-5 py-2 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
            >
              Vai allo Shop
            </Link>
            <Link
              href="/shop/espansioni"
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
            <Link href="/guide/come-scegliere-booster-box" className="text-[var(--accent)] hover:text-white">
              Come scegliere un booster box →
            </Link>
            <Link href="/guide/etb-cosa-sono-elite-trainer-box" className="text-[var(--accent)] hover:text-white">
              Cosa sono le ETB →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
