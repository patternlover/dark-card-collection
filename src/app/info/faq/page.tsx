'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: 'I prodotti sono originali?',
    answer: 'Sì, tutti i nostri prodotti sono originali e sigillati. Acquistiamo direttamente dai distributori ufficiali per garantire l\'autenticità di ogni item.',
  },
  {
    question: 'Come funziona la spedizione?',
    answer: 'Utilizziamo corrieri tracciabili per tutti gli ordini. Una volta spedito il tuo ordine, riceverai un codice di tracciamento via email. La spedizione gratuita è disponibile per ordini superiori a €100.',
  },
  {
    question: 'Posso restituire un prodotto?',
    answer: 'Sì, è possibile restituire un prodotto entro 14 giorni dalla ricezione, a condizione che sia sigillato e nelle condizioni originali. Contattaci per avviare la procedura di reso.',
  },
  {
    question: 'Come funzionano i preordini?',
    answer: 'I preordini ti permettono di riservare i prodotti prima della loro uscita ufficiale. Pagherai al momento del preordine e riceverai il prodotto non appena sarà disponibile.',
  },
  {
    question: 'Quali metodi di pagamento accettate?',
    answer: 'Accettiamo carte di credito, debito e altri metodi di pagamento tramite Stripe, il nostro partner per i pagamenti sicuri.',
  },
  {
    question: 'Come posso contattarvi?',
    answer: 'Puoi contattarci tramite il form nella pagina Contatti, oppure via email. Rispondiamo entro 24 ore lavorative.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-4">Domande Frequenti</h1>
        <p className="text-zinc-400 mb-8">
          Trova le risposte alle domande più comuni sui nostri prodotti e servizi.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="font-medium text-white">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-sm text-zinc-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
