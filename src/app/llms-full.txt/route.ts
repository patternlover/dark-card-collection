import { getPayloadClient } from '@/lib/payload'
import { groupProducts } from '@/lib/group-products'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com').replace(/\/+$/, '')

export const revalidate = 3600

const SHOP_SERVICES = `
## Servizi

- [Shop Pokémon TCG](${SITE_URL}/shop) - Booster box, ETB, collection box e SPC sigillati delle ultime espansioni.
- [Collezioni in vendita](${SITE_URL}/shop/collections) - Tutte le collezioni attualmente disponibili, con schede prodotto dettagliate.
- [Preordini](${SITE_URL}/shop/preorders) - Prodotti in arrivo e attualmente in attesa (preorder).
- [Novità](${SITE_URL}/shop/new-arrivals) - Ultimi prodotti aggiunti al catalogo.
- [Bestseller](${SITE_URL}/shop/bestsellers) - I prodotti più venduti del negozio.
`

const PRODUCTS_OVERVIEW = `
## Cosa vendiamo

Vendiamo esclusivamente prodotti sigillati del Pokémon Trading Card Game, acquistati da distributori ufficiali. Non vendiamo carte singole: ogni prodotto è sigillato e originale al 100%.

- **Booster Box**: scatola da 36 bustine (10 carte ciascuna) di una singola espansione. Prezzo tipico 90-120 € per i set recenti. Il miglior costo per bustina.
- **Elite Trainer Box (ETB)**: kit ufficiale con 8-9 bustine dell'espansione, 1 carta promozionale foil esclusiva, 65 segna-danni, dadi, segnalini status e scatola rigida da collezione. Prezzo tipico 40-60 €.
- **Collection Box**: scatole da collezione con bustine selezionate, carte promozionali e accessori.
- **Super Premium Collection (SPC)**: set premium con più bustine e contenuti esclusivi.
`

const SHIPPING_AND_RETURNS = `
## Spedizioni e resi

- Spedizione esclusivamente in Italia, tracciata e assicurata, con imballaggio rigido e protettivo.
- Costo di spedizione: 9,99 € per ordine.
- Spedizione gratuita per ordini dagli 80 €.
- Consegna indicativa: 1-3 giorni lavorativi dalla conferma dell'ordine.
- Diritto di recesso entro 14 giorni dalla consegna (art. 52 e seguenti del D.Lgs. 206/2005), solo per prodotti sigillati e mai aperti. Le spese di reso sono a carico del cliente, salvo prodotti difettosi.
- Rimborso tramite Stripe sullo stesso metodo di pagamento entro 14 giorni dalla ricezione del reso.
- Prodotti danneggiati o difettosi: segnalarli entro 48 ore dalla consegna per sostituzione o rimborso completo, incluse le spese di spedizione.
`

const PAYMENTS = `
## Pagamenti

Pagamenti sicuri tramite Stripe: carte di credito, carte di debito e altri metodi supportati dalla piattaforma.
`

const CONTACTS = `
## Contatti

- Email: darkcardcollection@gmail.com
- [Modulo di contatto](${SITE_URL}/info/contact)
- Rispondiamo entro 24 ore lavorative.
- [Chi Siamo](${SITE_URL}/info/about)
- [Domande frequenti](${SITE_URL}/info/faq)
`

const GUIDE_DOVE_COMPRARE = `
### Dove comprare carte Pokémon originali

[Guida completa](${SITE_URL}/guide/dove-comprare-carte-pokemon-originali)

Per comprare carte Pokémon originali online il modo più sicuro è rivolgersi a negozi specializzati che vendono prodotti sigillati acquistati da distributori autorizzati, con imballaggio protetto e spedizione tracciabile. Diffida dei prezzi molto sotto il mercato e dei venditori senza recensioni.

Cosa controllare prima di comprare:

- Il venditore vende solo Pokémon TCG o è specializzato in TCG.
- I prodotti sono sigillati e con foto reali.
- Ci sono recensioni verificate e una pagina contatti.
- Il prezzo è in linea con il prezzo medio di mercato.
- L'imballaggio protegge la scatola (cartone rigido).
- La spedizione è tracciabile e assicurata.

I canali più affidabili in Italia sono i negozi specializzati online e i rivenditori autorizzati locali. Le piattaforme di annunci o i marketplace aperti vanno usati con cautela: la contraffazione di bustine sigillate esiste, quindi controlla sempre il seller rating e chiedi foto reali del prodotto.

Domande frequenti sulla guida:

- Dove comprare carte Pokémon originali online? Il modo più sicuro è acquistare da negozi specializzati autorizzati che vendono prodotti sigillati con imballaggio professionale. Evita venditori senza recensioni o con prezzi molto sotto il mercato.
- Come riconoscere un booster box originale? Ha la pellicola termoretraibile integra, il codice colore sul blister, loghi e codici stampati in modo nitido e i sigilli a cialda con il logo. Se la pellicola è rovinata o le stampe sono sfocate, probabilmente non è originale.
- I prodotti sigillati si possono contraffare? Sì, esistono bustine sigillate contraffatte. Conviene comprare solo da negozi che acquistano direttamente dai distributori autorizzati e che espongono garanzie di autenticità.
- Quanto costa la spedizione di carte Pokémon? In Italia costa 9,99 € ed è gratuita per ordini dagli 80 €. I prodotti viaggiano in packaging rigido e protetto.
`

const GUIDE_BOOSTER_BOX = `
### Come scegliere un booster box Pokémon

[Guida completa](${SITE_URL}/guide/come-scegliere-booster-box)

Un booster box Pokémon contiene in genere 36 bustine sigillate (10 carte ciascuna) di una singola espansione. È la scelta migliore se vuoi aprire tante bustine a costo unitario ridotto: il prezzo per bustina è molto più basso rispetto all'acquisto singolo.

Costo per bustina confrontato:

- Booster box (36 bustine): costo per bustina basso (migliore).
- Booster bundle (6 bustine): costo per bustina medio.
- Bustine singole (1 bustina): costo per bustina alto.

Come valutare il prezzo: il prezzo di un booster box dipende dall'espansione, non dal costo di listino. I set recenti e stampati in grande quantità costano meno (di solito tra 90 e 120 €); le espansioni più vecchie o con alta domanda salgono. Confronta sempre con il prezzo medio di vendita indicato nella scheda prodotto.

Quando conviene un booster box:

- Vuoi aprire molte bustine della stessa espansione.
- Vuoi completare un set e hai bisogno di molte carte comuni.
- Vuoi collezionare da sigillato e rivendere in futuro.
- Cerchi il costo per bustina più basso possibile.

Domande frequenti sulla guida:

- Quante bustine contiene un booster box Pokémon? In genere 36, ognuna con 10 carte. Esistono anche box più piccoli (booster bundle) con 6 bustine.
- Quanto costa un booster box Pokémon? I set più recenti si trovano tra 90 e 120 €; set più vecchi o introvabili possono costare molto di più.
- Conviene comprare il booster box o le bustine singole? Se vuoi aprire molte bustine di una stessa espansione conviene il booster box: il costo per bustina è molto più basso. Se cerchi carte specifiche, le singole sono più economiche nel lungo periodo.
- Come verificare che un booster box sia sigillato? Controlla la pellicola termoretraibile integra, i sigilli con il logo e l'assenza di tagli o riaperture. Comprando da negozi autorizzati che vendono solo sigillato, il rischio è minimo.
`

const GUIDE_ETB = `
### ETB: cosa sono le Elite Trainer Box Pokémon

[Guida completa](${SITE_URL}/guide/etb-cosa-sono-elite-trainer-box)

L'Elite Trainer Box (ETB) è il kit ufficiale per allenatori e collezionisti del Pokémon TCG: contiene bustine dell'espansione, una carta promozionale foil esclusiva e gli accessori da gioco. Costa meno di un booster box ma offre contenuti che il box non ha.

Cosa c'è dentro una ETB:

- 8-9 bustine dell'espansione della collezione.
- 1 carta promozionale foil esclusiva.
- 65 segna-danni, dadi e segnalini status.
- 1 pellicola per il dado (sleeve).
- 1 scatola rigida da collezione con divisori.

ETB o booster box?

- Bustine: ETB 8-9, booster box 36.
- Carta promozionale: ETB sì esclusiva, booster box no.
- Accessori da gioco: ETB sì, booster box no.
- Prezzo indicativo: ETB 40-60 €, booster box 90-120 €.

A chi conviene una ETB:

- Vuoi la carta promozionale esclusiva della collezione.
- Giochi e ti servono dadi e segna-danni.
- Vuoi una scatola rigida per ordinare la collezione.
- Vuoi provare un'espansione senza comprare 36 bustine.

Domande frequenti sulla guida:

- Cosa contiene una Elite Trainer Box Pokémon? In genere 8-9 bustine di una espansione, una carta promozionale foil esclusiva, dadi per i segni-danno, segnalini status, una pellicola per il dado e una scatola da collezione.
- Quanto costa una Elite Trainer Box? Di solito tra 40 e 60 € per i set recenti; le espansioni più richieste possono valere di più.
- ETB o booster box: cosa conviene? Per massimizzare il numero di bustine conviene il booster box (36 bustine). L'ETB conviene se vuoi la carta promozionale esclusiva, gli accessori da gioco e una scatola da collezione.
- Le carte promozionali delle ETB sono esclusive? Sì, ogni ETB include una carta promozionale foil esclusiva stampata per quella espansione, spesso tra le carte più ricercate dai collezionisti.
`

const FAQ = `
## Domande frequenti

- I prodotti sono originali? Sì, tutti i prodotti sono originali e sigillati. Acquistiamo direttamente dai distributori ufficiali per garantire l'autenticità di ogni articolo.
- Come funziona la spedizione? Spediamo in tutta Italia con corrieri tracciabili. La spedizione è gratuita per ordini dagli 80 €, altrimenti costa 9,99 €. Una volta spedito, riceverai un codice di tracciamento via email.
- Quanto tempo impiega la consegna? Gli ordini vengono preparati entro 24 ore lavorative e la consegna avviene in genere in 2-4 giorni lavorativi dal ritiro del corriere.
- Posso restituire un prodotto? Sì, entro 14 giorni dalla ricezione, a condizione che sia sigillato e nelle condizioni originali. Contattaci per avviare la procedura di reso.
- Come funzionano i preordini? I preordini ti permettono di riservare i prodotti prima della loro uscita ufficiale. Paghi al momento del preordine e ricevi il prodotto non appena sarà disponibile.
- Quali metodi di pagamento accettate? Carte di credito, debito e altri metodi tramite Stripe, il nostro partner per i pagamenti sicuri.
- Come riconosco un booster box sigillato originale? Presenta la pellicola termoretraibile integra, il codice colore del blister e la scatola con loghi e codici ufficiali. Vendiamo solo prodotti sigillati acquistati da distributori autorizzati.
- Fate spedizioni fuori dall'Italia? Attualmente spediamo esclusivamente in Italia. In futuro valuteremo l'espansione all'Unione Europea.
- Come posso contattarvi? Tramite il form nella pagina Contatti, oppure via email a darkcardcollection@gmail.com. Rispondiamo entro 24 ore lavorative.
`

async function getCatalogSection(): Promise<string> {
  try {
    const payload = await getPayloadClient()

    let docs: any[] = []
    let page = 1
    while (page <= 10) {
      const result = await payload.find({
        collection: 'products',
        where: {
          and: [
            { status: { in: ['listed', 'hold', 'sold'] } },
            { is_visible: { equals: true } },
          ],
        },
        limit: 500,
        page,
        sort: 'title',
      })
      docs = docs.concat(result.docs)
      if (page >= result.totalPages || result.docs.length === 0) break
      page += 1
    }

    const groups = groupProducts(docs)

    if (groups.length === 0) return '- Nessun prodotto disponibile al momento.'

    const lines = groups.map((group) => {
      const price =
        group.sellingPrice > 0
          ? `${group.sellingPrice.toFixed(2).replace('.', ',')} €`
          : 'prezzo su richiesta'
      const availability = group.products.some((p: any) => p.status === 'listed')
        ? 'Disponibile'
        : group.products.some((p: any) => p.is_preorder || p.status === 'hold')
          ? 'In attesa (preorder)'
          : 'Venduto'
      return `- [${group.title}](${SITE_URL}/products/${group.slug}) - Prezzo: ${price} - Disponibilità: ${availability}`
    })

    return lines.join('\n')
  } catch {
    return '- Catalogo momentaneamente non disponibile.'
  }
}

export async function GET() {
  const catalog = await getCatalogSection()

  const content = `# Dark Card Collection

> Negozio online di prodotti Pokémon TCG sigillati: Booster Box, Elite Trainer Box (ETB), Collection Box e Super Premium Collection (SPC), originali al 100%, acquistati da distributori autorizzati e venduti esclusivamente sigillati. Spedizione gratuita in Italia dagli 80 €.
${SHOP_SERVICES}---
${PRODUCTS_OVERVIEW}---
${SHIPPING_AND_RETURNS}---
${PAYMENTS}---
${CONTACTS}---
## Guide

${GUIDE_DOVE_COMPRARE}
${GUIDE_BOOSTER_BOX}
${GUIDE_ETB}---
${FAQ}---
## Catalogo prodotti

Elenco dei prodotti disponibili nel negozio, aggiornato automaticamente. Ogni riga indica il prodotto, il prezzo di vendita e la disponibilità attuale.

${catalog}
`

  return new Response(content, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
