# SEO + GEO + Technical SEO + AI Overviews — Piano Operativo

Progetto: Dark Card Collection — e-commerce italiano Pokémon TCG sigillati
Sito: https://darkcardcollection.com | Stack: Next.js 15 (App Router) + Payload CMS + Vercel

> Scopo: massimizzare visibilità, CTR, trust e raccomandabilità su query commerciali e
> transazionali italiane ("Primi compagni d'avventura", "booster box pokemon", "etb pokemon",
> "bustine pokemon", "carte singole pokemon", "accessori pokemon") e la probabilità di essere
> citati negli AI Overviews di Google e nei riassunti degli LLM.
> Nessuna promessa di ranking garantiti: l'obiettivo è aumentare la probabilità di dominare.

---

## 1. Audit — problemi principali

### 1.1 SEO tecnica (critico)
| # | Problema | Gravità | Stato attuale |
|---|----------|---------|---------------|
| T1 | **Canonical sbagliato su tutte le sottopagine** | 🔴 Critica | `layout.tsx` imposta `alternates.canonical: '/'` → TUTTI i PDP e le pagine dichiarano come canonical la homepage. I PDP non la sovrascrivono → Google può non indicizzare le schede prodotto. |
| T2 | Sitemap incompleta | 🟠 Alta | Solo rotte statiche + max 200 prodotti. Manca: collezioni, categorie, guide. |
| T3 | Titoli/meta troppo generici su Shop/Collezioni/Bestseller | 🟠 Alta | "Shop", "Collezioni", "Bestseller" senza keyword commerciali né modulari di CTR. |
| T4 | Nessun rich result | 🔴 Critica | Assenti: Product+Offer, BreadcrumbList, FAQPage, ItemList, MerchantReturnPolicy, OfferShippingDetails. |
| T5 | FAQ nascosta in accordion client-side | 🟠 Alta | Contenuto non leggibile da LLM/crawler quando chiuso; nessun markup FAQPage. |
| T6 | Asset statico rotto | 🟡 Media | Cartelle `public/images/*` con nomi corrotti (`logo}`, `banners}`) e vuote. |
| T7 | Nessuna OG image | 🟡 Media | Condivisioni social senza immagine; CWV/rich preview deboli. |
| T8 | Prodotti limitati a 200 nella sitemap | 🟠 Alta | Con cataloghi grandi molti prodotti restano fuori dalla sitemap. |

### 1.2 On-page / contenuti
| # | Problema | Impatto |
|---|----------|---------|
| C1 | Nessuna pagina landing per collezione ("Primi compagni d'avventura", "Destino Sfuggente"...). Le query per set sono presidiate solo da `/shop?collection=X` (senza meta, senza H1, noindex-friendly). | Altissimo |
| C2 | Nessuna pagina per categoria (booster box, ETB, bustine, carte singole, accessori). Query commerciali scoperte. | Altissimo |
| C3 | Nessun contenuto editoriale/guida → zero possibilità di essere fonte citata in AI Overviews su "come scegliere", "dove comprare", "differenza ETB vs booster box". | Alto |
| C4 | H1 deboli: "Shop", "Collezioni", "Domande Frequenti". | Medio |
| C5 | PDP con contenuto sottile: nessun blocco "Descrizione/Set/Contenuto della scatola", pochi paragrafi per LLM. | Alto |
| C6 | FAQ (6 domande) troppo poche e generiche; mancano domande transazionali (prezzi, tempi, autenticità, preordini). | Medio |

### 1.3 Internal linking
| # | Problema | Impatto |
|---|----------|---------|
| I1 | PDP non linka alla pagina collezione né alla categoria. | Alto |
| I2 | Collezioni hub → prodotti via query string, non a landing dedicate. | Alto |
| I3 | Homepage non linka alle guide né alle collezioni. | Medio |
| I4 | Footer minimo (nessuna link "Guide"). | Medio |

### 1.4 Trust e snippet SERP
| # | Problema | Impatto |
|---|----------|---------|
| S1 | Niente recensioni visibili né schema Review/AggregateRating (non vanno inventate: va abilitato un sistema recensioni). | Alto |
| S2 | Nessun dato aziendale reale nel footer (nome legale/indirizzo segnaposto) → meno trust E-E-A-T. | Alto |
| S3 | Title PDP senza prezzo/collezione; niente "disponibilità" nella SERP. | Medio |
| S4 | Niente breadcrumb strutturati → SERP mostra URL invece del percorso. | Medio |

### 1.5 AI-friendliness (GEO)
| # | Problema | Impatto |
|---|----------|---------|
| A1 | Contenuti non "estractable": le risposte devono stare nel DOM, essere brevi, dirette, verificabili, con titoli chiari (H2 = domanda). | Alto |
| A2 | Nessuna sezione FAQ su homepage e PDP (fonte preferita dagli AI Overviews). | Alto |
| A3 | Assenza di pagine "hub" tematiche (dove comprare carte pokemon originali, come scegliere booster box). | Alto |

---

## 2. Roadmap prioritaria

| Priorità | Azione | Impatto SEO | Impatto GEO/AI | Difficoltà | Owner |
|----------|--------|-------------|----------------|------------|-------|
| **P0 — subito** | Fix canonical root + canonical espliciti per pagina | Critico | Alto | Bassa | Dev |
| **P0** | Structured data: Organization, WebSite, Product+Offer, Breadcrumb, FAQPage, ItemList, MerchantReturnPolicy, OfferShippingDetails | Critico | Alto | Media | Dev |
| **P0** | Landing pagine collezione `/shop/collections/[slug]` | Altissimo | Alto | Media | Dev |
| **P0** | Landing pagine categoria `/shop/categories/[slug]` | Altissimo | Alto | Media | Dev |
| **P1** | Guide editoriali con FAQ estraibili (hub + 3 guide) | Alto | Altissimo | Media | Content+Dev |
| **P1** | Sitemap completa (collezioni, categorie, guide, prodotti paginati) | Alto | Medio | Bassa | Dev |
| **P1** | Title/meta CTR-optimized su Shop, Bestseller, Novità, Preordini, Collezioni, FAQ, Chi Siamo | Alto | Medio | Bassa | SEO |
| **P1** | FAQ server-rendered + FAQPage JSON-LD | Medio | Alto | Bassa | Dev |
| **P2** | OG image default + per prodotto | Medio | Basso | Media | Dev |
| **P2** | Internal linking (PDP→collezione/categoria, homepage→guide/collezioni, footer→guide) | Medio | Medio | Bassa | Dev |
| **P2** | Sistema recensioni (Review/AggregateRating reali) | Alto | Alto | Alta | Dev+SEO |
| **P2** | Dati aziendali reali (ragione sociale, indirizzo, P.IVA) nel footer e in Organization.sameAs | Alto | Alto | Bassa | SEO |
| **P3** | Blog/guide mensili, pagine "informative" per set, prezzo medio di mercato | Alto | Alto | Media | Content |

---

## 3. Linee guida contenuti (struttura)

### Homepage
- **Above the fold (≤5s)**: proposta di valore + prova di autenticità + spedizione gratis 80€ + CTA.
- **H1**: keyword principale ("Pokémon TCG Sigillati").
- **Blocchi**: Hero → Trust (100% originale, spedizione rapida) → Featured (max 4) → "Perché noi" → Collezioni in evidenza (link alle landing) → Guide (link) → FAQ breve (estraibile) → CTA.
- **Da evitare**: H1 lungo, zero testo sopra la piega, immagini senza alt.

### Categoria / Sottocategoria (landing)
- **H1**: "Booster Box Pokémon" / "ETB Pokémon (Elite Trainer Box)".
- **Intro (150-250 parole)**: cos'è, a chi serve, cosa contiene — risposta diretta alle domande.
- **H2**: "Le migliori offerte in questo momento" (griglia), "Come scegliere", "Prezzi di mercato".
- **Trust block**: sigillato/originale, spedizione 80€, resi 14 gg.
- **FAQ 4-6 domande** (estraibili).
- **Internal linking**: da/verso collezioni, guide, PDP.

### Prodotto (PDP)
- **Title** (≤60 char): `{Nome} | {Collezione} | Dark Card Collection`.
- **Meta description** (≤155 char): prezzo, disponibilità, spedizione gratis, CTA.
- **Sopra la piega**: immagine, prezzo, disponibilità, lingua/condizione, ATC, trust mini.
- **H2**: "Descrizione", "Contenuto della confezione", "Autenticità e spedizione", "FAQ prodotto".
- **Dati**: Set, lingua, condizione, codice, prezzo medio di mercato.
- **Schema**: Product + Offer + OfferShippingDetails + MerchantReturnPolicy + BreadcrumbList.

### FAQ
- Domanda come **H2/H3** (o `<summary>`), risposta 30-80 parole, diretta, prima persona plurale.
- Sempre con **FAQPage JSON-LD**.

### Guide
- **H1** domanda commerciale ("Dove comprare carte Pokémon originali?").
- Intro 60-100 parole con risposta diretta (estrabile dagli LLM).
- H2/H3 domande (alimentano AI Overviews), liste, tabelle, link interni.
- FAQ finali + FAQPage JSON-LD.

---

## 4. Schema markup (JSON-LD)

### Organization (homepage)
```json
{
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": "https://darkcardcollection.com/#organization",
  "name": "Dark Card Collection",
  "url": "https://darkcardcollection.com",
  "logo": "https://darkcardcollection.com/icon.svg",
  "image": "https://darkcardcollection.com/og.png",
  "priceRange": "€€",
  "currenciesAccepted": "EUR",
  "paymentAccepted": "Carta di credito, debito",
  "areaServed": "IT",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "darkcardcollection@gmail.com",
    "url": "https://darkcardcollection.com/info/contact",
    "areaServed": "IT",
    "availableLanguage": "it"
  }
}
```

### WebSite + SearchAction
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://darkcardcollection.com/#website",
  "url": "https://darkcardcollection.com",
  "name": "Dark Card Collection",
  "inLanguage": "it-IT",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://darkcardcollection.com/shop?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### Product + Offer + OfferShippingDetails + MerchantReturnPolicy (PDP)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://darkcardcollection.com/products/{slug}#product",
  "name": "{title}",
  "image": ["{immagine}"],
  "description": "{description}",
  "sku": "{itemId}",
  "offers": {
    "@type": "Offer",
    "@id": "https://darkcardcollection.com/products/{slug}#offer",
    "url": "https://darkcardcollection.com/products/{slug}",
    "priceCurrency": "EUR",
    "price": "{prezzo}",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "priceValidUntil": "{data}",
    "seller": { "@type": "Organization", "name": "Dark Card Collection" },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": "9.99",
        "eligibleTransactionVolume": {
          "@type": "PriceSpecification",
          "price": "80.00",
          "priceCurrency": "EUR"
        }
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "IT"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 1, "unitCode": "DAY" },
        "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 4, "unitCode": "DAY" }
      }
    }
  },
  "merchantReturnPolicy": {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "IT",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 14,
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
  }
}
```
> Nota: `shippingRate` con `eligibleTransactionVolume` ≥80€ → spedizione €0 (gratis). `availability` dipende dallo status: `InStock`/`PreOrder`/`OutOfStock`.

### BreadcrumbList (PDP, collezioni, categorie, guide)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://darkcardcollection.com" },
    { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://darkcardcollection.com/shop" },
    { "@type": "ListItem", "position": 3, "name": "Collezioni", "item": "https://darkcardcollection.com/shop/collections" },
    { "@type": "ListItem", "position": 4, "name": "{Nome collezione}", "item": "https://darkcardcollection.com/shop/collections/{slug}" }
  ]
}
```

### FAQPage
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "I prodotti sono originali?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, tutti i nostri prodotti sono originali e sigillati. Acquistiamo direttamente dai distributori ufficiali."
      }
    }
  ]
}
```

### ItemList (collezioni/categorie)
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "{title}", "url": "https://darkcardcollection.com/products/{slug}" }
  ]
}
```

---

## 5. Fix snippet SERP

### Title (regole)
- ≤ 60 caratteri, keyword primaria all'inizio, brand alla fine, separatore `|`.
- Includere prezzo o disponibilità dove utile (es. PDP: "Booster Box X | €89,90 | Disponibile").
- **No duplicate**: ogni pagina con title unico.

### Meta description
- ≤ 155 caratteri, 1 CTA, menzionare spedizione gratuita 80€, autenticità, disponibilità.
- Formato win-win: "Problema → Soluzione → CTA".

### Esempi concreti
| Pagina | Title | Meta description |
|--------|-------|------------------|
| Homepage | `Pokémon TCG Sigillati | Booster Box, ETB | Dark Card Collection` | "Booster Box, ETB e Collection Box Pokémon TCG originali e sigillati. Spedizione gratuita in Italia dagli 80 €. Acquista ora." |
| Shop | `Shop Pokémon TCG | Booster Box, ETB e Sigillati | Dark Card Collection` | "Tutti i nostri prodotti Pokémon TCG sigillati: booster box, ETB, collection box, SPC. Originali al 100%, spedizione gratuita dagli 80 €." |
| Collezioni | `Collezioni Pokémon TCG | Tutte le Espansioni | Dark Card Collection` | "Esplora tutte le collezioni Pokémon TCG in vendita: Primi Compagni d'Avventura, Destino Sfuggente e molte altre. Originali e sigillati." |
| Landing collezione | `Primi Compagni d'Avventura | Booster Box, ETB | Dark Card Collection` | "Booster Box, ETB e Collection Box di Primi Compagni d'Avventura a prezzo di mercato. Sigillati e originali, spedizione gratuita dagli 80 €." |
| PDP | `Booster Box Primi Compagni d'Avventura | €89,90 | Disponibile` | "Booster Box di Primi Compagni d'Avventura a €89,90. Sigillata e originale, spedizione gratuita in Italia dagli 80 €. Acquista ora." |
| FAQ | `FAQ Pokémon TCG | Spedizioni, Resi, Autenticità` | "Risposte su autenticità, spedizione gratuita dagli 80 €, resi in 14 giorni e preordini. Contattaci per qualsiasi dubbio." |
| Guida | `Dove Comprare Carte Pokémon Originali | Guida 2026` | "Come riconoscere prodotti Pokémon originali e dove comprarli online senza rischi: booster box, ETB e bustine sigillate." |

### Rich results / breadcrumb / favicon / sitename
- BreadcrumbList su tutte le pagine → SERP mostra il percorso (Home › Shop › Collezioni › Nome).
- Favicon presente (`/icon.svg`) → serve anche per sitename Google; aggiungere `webmaster_verification` e `appleWebApp` (manifest già presente).
- Aggiungere `<meta name="application-name">` (Next lo deduce dal manifest).
- Ogni pagina deve avere `canonical` esplicito (fix P0).

---

## 6. Linee guida contenuti estraibili (AI Overviews / LLM)

1. **Risposte dirette nel DOM**: la risposta alla domanda deve essere un paragrafo breve subito sotto l'H2/H3 che la formula (mai solo "approfondisci qui").
2. **Struttura domanda = titolo**: "Come riconoscere un booster box originale?" come H2; risposta di 40-80 parole subito dopo.
3. **Contenuti verificabili**: prezzi, date di uscita, numeri di carte, link alla fonte (sito ufficiale Pokémon), FAQ — fattori di fiducia per i sistemi di answer.
4. **Non solo keyword**: l'LLM cita chi risponde bene alla domanda, non chi ripete le parole chiave. Scrivere per l'intento.
5. **Schema FAQPage + breadcrumb**: segnalano struttura semantica chiara.
6. **FAQ in ogni pagina chiave** (home, PDP, collezione, categoria, guide): più blocchi estraibili.
7. **Coerenza dati**: prezzo, spedizione (80€ gratis), resi 14gg — mai contraddire AI Overviews con dati contrastanti nella stessa pagina.
8. **Table-friendly**: liste, tabelle (es. "ETB vs Booster Box"), definizioni chiare → contenuto preferito dagli LLM.

---

## 7. Checklist finale (dev / seo / content)

### Dev
- [x] Fix canonical root (rimosso `/` globale)
- [x] Canonical espliciti su tutte le pagine principali
- [x] JSON-LD: OnlineStore/Organization, WebSite+SearchAction (homepage)
- [x] JSON-LD: Product+Offer+ShippingDetails+MerchantReturnPolicy (PDP)
- [x] JSON-LD: BreadcrumbList (PDP, collezioni, categorie, guide, FAQ)
- [x] JSON-LD: FAQPage (FAQ, guide)
- [x] JSON-LD: ItemList (collezioni, categorie)
- [x] Landing collezioni `/shop/collections/[slug]`
- [x] Landing categorie `/shop/categories/[slug]`
- [x] Guide + hub `/guide`
- [x] Sitemap completa (prodotti paginati + collezioni + categorie + guide)
- [x] OG image default (`/og.png`) + OG per PDP
- [x] Fix asset `public/images`
- [x] FAQ server-rendered (contenuto nel DOM)
- [x] Internal linking PDP→collezione/categoria, footer→guide, homepage→guide/collezioni
- [ ] Pagine 200 con `stale-while-revalidate` adeguati (Vercel) — da verificare
- [ ] `webmaster_verification` (GSC/Bing) — action manuale utente

### SEO
- [ ] Dati aziendali reali (footer + Organization) — richiede input utente
- [ ] Keyword research per collezione (Google Keyword Planner / Search Console)
- [ ] Monitorare Search Console post-deploy (indici, rich results, Core Web Vitals)
- [ ] Richiesta indicizzazione landing collezioni/categorie/guide

### Content
- [ ] 1 guida/settimana (8-10/trimestre)
- [ ] FAQ per set/collezione su ogni landing
- [ ] Descrizioni PDP con "contenuto della confezione" (150-200 parole per i prodotti top)
- [ ] Pagina "Prezzi carte Pokémon" (prezzo medio di mercato) — già parzialmente coperta da averageSalePrice

---

## 8. 15 fix immediati ad alto impatto

| # | Fix | Owner | Effort | Priorità |
|---|-----|-------|--------|----------|
| 1 | Fix canonical globale (`/`) → canonical per pagina | Dev | S | P0 |
| 2 | JSON-LD Product+Offer su PDP | Dev | M | P0 |
| 3 | JSON-LD BreadcrumbList su PDP/collezioni/categorie/guide | Dev | S | P0 |
| 4 | Landing collezione `/shop/collections/[slug]` | Dev | M | P0 |
| 5 | Landing categoria `/shop/categories/[slug]` | Dev | M | P0 |
| 6 | Title/meta CTR su Shop, Bestseller, Novità, Preordini, Collezioni, FAQ | SEO | S | P1 |
| 7 | FAQ server-rendered + FAQPage JSON-LD | Dev | S | P1 |
| 8 | JSON-LD FAQPage sulle guide | Dev | S | P1 |
| 9 | Sitemap completa con paginazione | Dev | S | P1 |
| 10 | Guide hub + 3 guide (dove comprare, booster box, ETB) | Content+Dev | M | P1 |
| 11 | OG image default + per prodotto | Dev | M | P2 |
| 12 | Internal linking (PDP→collezione, footer→guide, home→collezioni/guide) | Dev | S | P2 |
| 13 | SearchAction + OnlineStore schema su homepage | Dev | S | P0 |
| 14 | Fix asset `public/images` + rimozione cartelle rotte | Dev | S | P2 |
| 15 | Metadati mancanti (Contact, FAQ) tramite server component | Dev | S | P1 |

---

## Extra obbligatori

### Come rendere il sito più forte e desiderabile dei competitor in SERP
1. **Rich results**: recensioni e prezzi visibili (Product schema) → i competitor senza schema perdono il confronto "a colpo d'occhio".
2. **Landing dedicate per set** (collezioni): per "Primi compagni d'avventura serie 2" la landing con title dedicato, prezzo, disponibilità e schema batte una pagina di categoria generica.
3. **Trasparenza prezzi**: `averageSalePrice` + "prezzo medio di mercato" → fiducia E-E-A-T e risposta alle query "quanto costa".
4. **Speed & mobile**: design neobrutal leggero, immagini ottimizzate; verificare CWV su Search Console.
5. **Authoritativeness**: guide, FAQ dettagliate, dati aziendali reali, email di contatto pubblica → segnali di fiducia che Google e LLM usano per scegliere le fonti.

### Far capire a un utente freddo in <5s perché cliccare e comprare qui
Above the fold della homepage (e di ogni landing):
1. **Cosa vendo** (H1 immediato): "Pokémon TCG Sigillati"
2. **Perché qui**: badge "100% Originali" + "Sigillati"
3. **Perché ora**: "Spedizione gratuita in Italia dagli 80 €"
4. **Prova sociale**: "24h spedizione", numero prodotti, prezzo medio di mercato
5. **CTA**: "Esplora lo Shop" + "Preordini"
Formule di CTA già presenti e valide; da aggiungere un micro-blocco "Perché comprare da noi" (4 punti) con collegamenti a Chi Siamo/FAQ.

### Presidiare query prodotto specifiche ("Primi compagni d'avventura serie 2")
- Landing `/shop/collections/primi-compagni-davventura` con: title = nome set + "serie 2", intro con risposta diretta ("La collezione Primi Compagni d'Avventura serie 2 contiene..."), griglia prodotti (booster box, ETB, SPC), FAQ set, schema BreadcrumbList+ItemList, link ai PDP.
- Variante in sitemap con priority alta.
- Aggiornare la landing appena esce una nuova "serie/ripresa" del set.

### Title, meta, dati strutturati, immagini, trust, snippet per max appetibilità
Vedi sezione 5 + 6. Regola d'oro: ogni pagina deve vincere il confronto SERP su **4 assi**: (1) title/meta più pertinenti, (2) rich result attivo, (3) immagine/logo riconoscibili, (4) trust visibile (prezzo, spedizione, resi, recensioni).

### Aumentare probabilità di citazione negli AI Overviews
- FAQPage su homepage, PDP, collezioni, categorie, guide.
- Risposte dirette 40-80 parole sotto H2/H3 domanda.
- Dati coerenti e verificabili (prezzi, date, numeri).
- Link interni tra hub tematici (guide ↔ collezioni ↔ PDP) per creare l'authority su cluster "Pokémon TCG Italia".
- Contenuto aggiornato (sitemap lastmod reale, date di uscita dei set).
