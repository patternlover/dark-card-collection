import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Informativa sulla privacy di Dark Card Collection.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Ultimo aggiornamento: 18 luglio 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Titolare del trattamento</h2>
            <p>
              Dark Card Collection (&quot;noi&quot;, &quot;nostro&quot;) &egrave; il titolare del trattamento dei dati
              personali raccolti tramite il sito{' '}
              <span className="text-white">dark-card-collection.vercel.app</span> (&quot;Sito&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Dati raccolti</h2>
            <p>Raccogliamo i seguenti dati personali:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Dati di identificazione:</strong> nome, indirizzo email (solo se forniti tramite il modulo di contatto o il checkout)</li>
              <li><strong className="text-white">Dati di pagamento:</strong> elaborati esclusivamente da Stripe. Non conserviamo dati di carte di credito sui nostri server</li>
              <li><strong className="text-white">Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, tempo di permanenza (solo con consenso analytics)</li>
              <li><strong className="text-white">Dati di ordine:</strong> prodotti acquistati, indirizzo di spedizione, cronologia ordini</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Finalit&agrave; del trattamento</h2>
            <p>I tuoi dati vengono trattati per:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Esecuzione del contratto:</strong> elaborazione ordini, spedizione, gestione pagamenti</li>
              <li><strong className="text-white">Obblighi legali:</strong> fatturazione, contabilit&agrave;, obblighi fiscali</li>
              <li><strong className="text-white">Assistenza clienti:</strong> risposta a domande e richieste tramite il modulo di contatto</li>
              <li><strong className="text-white">Analytics (con consenso):</strong> analisi dell&apos;uso del sito per migliorare i nostri servizi</li>
              <li><strong className="text-white">Marketing (con consenso):</strong> comunicazioni promozionali e remarketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Base giuridica del trattamento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Esecuzione del contratto</strong> (art. 6.1.b GDPR) &mdash; per l&apos;elaborazione degli ordini</li>
              <li><strong className="text-white">Obbligo legale</strong> (art. 6.1.c GDPR) &mdash; per la contabilit&agrave; e la fatturazione</li>
              <li><strong className="text-white">Consenso</strong> (art. 6.1.a GDPR) &mdash; per analytics e marketing</li>
              <li><strong className="text-white">Legittimo interesse</strong> (art. 6.1.f GDPR) &mdash; per la prevenzione delle frodi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Condivisione dei dati</h2>
            <p>I tuoi dati possono essere condivisi con:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Stripe:</strong> per l&apos;elaborazione dei pagamenti (Privacy Policy: stripe.com/privacy)</li>
              <li><strong className="text-white">Vercel:</strong> per l&apos;hosting del sito</li>
              <li><strong className="text-white">Neon.io:</strong> per il database PostgreSQL</li>
              <li><strong className="text-white">Google (solo con consenso):</strong> Google Analytics e Google Tag Manager</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookie</h2>
            <p>Il sito utilizza i seguenti cookie:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Necessari:</strong> cookie di sessione e preferenze (non richiedono consenso)</li>
              <li><strong className="text-white">Analytics:</strong> Google Analytics, Google Tag Manager (richiedono consenso)</li>
              <li><strong className="text-white">Marketing:</strong> cookie di remarketing e pubblicit&agrave; (richiedono consenso)</li>
            </ul>
            <p className="mt-2">
              Puoi gestire le tue preferenze cookie in qualsiasi momento tramite il banner dedicato
              o cancellando i cookie dal tuo browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Conservazione dei dati</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Dati di ordine:</strong> conservati per 10 anni (obbligo contabile italiano)</li>
              <li><strong className="text-white">Dati di contatto:</strong> fino a richiesta di cancellazione</li>
              <li><strong className="text-white">Cookie analytics:</strong> massimo 13 mesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. I tuoi diritti (GDPR)</h2>
            <p>Hai diritto a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Accesso</strong> (art. 15) &mdash; ottenere una copia dei tuoi dati</li>
              <li><strong className="text-white">Rettifica</strong> (art. 16) &mdash; correggere dati inesatti</li>
              <li><strong className="text-white">Cancellazione</strong> (art. 17) &mdash; richiedere la cancellazione dei tuoi dati</li>
              <li><strong className="text-white">Limitazione</strong> (art. 18) &mdash; limitare il trattamento</li>
              <li><strong className="text-white">Portabilit&agrave;</strong> (art. 20) &mdash; ricevere i tuoi dati in formato strutturato</li>
              <li><strong className="text-white">Opposizione</strong> (art. 21) &mdash; opporti al trattamento per marketing</li>
              <li><strong className="text-white">Revoca del consenso</strong> &mdash; in qualsiasi momento, senza pregiudicare la liceit&agrave; del trattamento precedente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Sicurezza</h2>
            <p>
              Adottiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati
              personali, inclusione la crittografia SSL/TLS per tutte le comunicazioni e
              l&apos;accesso limitato ai dati personali da parte del personale autorizzato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contattaci</h2>
            <p>
              Per esercitare i tuoi diritti o per domande sulla privacy, puoi contattarci
              tramite il nostro{' '}
              <a href="/info/contact" className="text-blue-400 underline hover:text-blue-300">
                modulo di contatto
              </a>{' '}
              o all&apos;indirizzo email indicato sul sito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Reclami</h2>
            <p>
              Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai diritto di
              presentare reclamo al Garante per la protezione dei dati personali
              (www.garanteprivacy.it).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
