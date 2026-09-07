"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-6 py-4">
      <Heading level="h3">{title}</Heading>
      <div className="mt-2 flex flex-col gap-2 text-sm">{children}</div>
    </div>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-1 pl-5">
      {items.map((s, i) => (
        <li key={i}>
          <Text>{s}</Text>
        </li>
      ))}
    </ol>
  )
}

function MapTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="flex flex-col gap-1">
      {rows.map(([a, b]) => (
        <div key={a} className="grid grid-cols-[1fr_1fr] gap-2 rounded-md border px-3 py-2">
          <Text weight="plus">{a}</Text>
          <Text className="text-muted-foreground">{b}</Text>
        </div>
      ))}
    </div>
  )
}

function GuidePage() {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Guida operativa</Heading>
        <Text className="text-muted-foreground">
          Cosa si vede sul sito e dove si cambia. Tutto il resto (magazzino, costi, margini)
          si calcola da solo: non modificare mai giacenze e costi a mano.
        </Text>
      </div>

      <Section title="1. Cosa si vede sul sito e dove si gestisce">
        <MapTable
          rows={[
            ["Prodotti (nome, prezzo, disponibilità)", "Prodotti → scheda prodotto"],
            ["Filtri Micro prodotto / Espansione", "Prodotti → Categoria / Collezione"],
            ["Vetrina homepage e Bestseller", "Prodotti → Metadata: featured = true"],
            ["Giacenze", "Lotti (mai a mano!)"],
            ["Ordini del sito", "Ordini → evasione (fulfillment)"],
            ["Immagini", "Flusso Vercel Blob (vedi nota nella scheda prodotto)"],
          ]}
        />
      </Section>

      <Section title="2. Pubblicare un prodotto sul sito">
        <Steps
          items={[
            "Apri Prodotti e cerca il prodotto per nome.",
            "Status deve essere Published (se è Draft, cambialo e salva).",
            "Apri la variante Default → Prices → aggiungi il prezzo in EUR e salva.",
            "Nella scheda prodotto → Sales channels → aggiungi Website e salva.",
            "Verifica su darkcardcollection.com/shop: il prodotto deve apparire con prezzo e disponibilità.",
          ]}
        />
        <Text className="text-muted-foreground">
          Regola: un prodotto si vede solo se è Published + ha il prezzo + è nel canale
          Website + ha giacenza. Se manca uno di questi, resta nascosto.
        </Text>
      </Section>

      <Section title="3. Nascondere un prodotto / esaurito">
        <Steps
          items={[
            "Per nasconderlo: Status → Draft (oppure togli il canale Website).",
            "Se la giacenza arriva a 0, il sito mostra da solo “Esaurito” e blocca l'acquisto: non serve nasconderlo.",
          ]}
        />
      </Section>

      <Section title="4. Cambiare un prezzo">
        <Steps
          items={[
            "Prodotti → apri il prodotto → variante Default → Prices.",
            "Modifica l'importo EUR e salva. Il sito si aggiorna da solo.",
          ]}
        />
      </Section>

      <Section title="5. Caricare merce in magazzino">
        <Steps
          items={[
            "Vai in Lotti → compila data, fonte, luogo e costi extra.",
            "Aggiungi le righe scegliendo i prodotti dal menu (mai id a mano), quantità e costo unitario.",
            "Registra: stock e costo medio si aggiornano da soli.",
          ]}
        />
      </Section>

      <Section title="6. Evadere un ordine del sito">
        <Steps
          items={[
            "Ordini → apri l'ordine (il pagamento Stripe è già incassato).",
            "Crea la spedizione (fulfillment) e inserisci il tracking se lo hai.",
            "Chiudi l'ordine quando spedito.",
          ]}
        />
      </Section>

      <Section title="7. Resi e rimborsi">
        <Text className="text-muted-foreground">
          Per ora: rimborso dalla dashboard Stripe + nota sull'ordine. I resi strutturati
          (resi parziali, cambi) arrivano con l'hardening. Non cancellare mai ordini con
          movimenti di magazzino senza dirlo: sballano FIFO e margini.
        </Text>
      </Section>

      <Section title="8. Vendite fuori sito (Vinted, eBay, mercatini)">
        <Text className="text-muted-foreground">
          Non registrarle come ordini a mano: la pagina dedicata con scarico FIFO e margine
          è in arrivo. Per ora chiedi: si registrano con procedura assistita.
        </Text>
      </Section>

      <Section title="9. Glossario (inglese Admin → italiano)">
        <MapTable
          rows={[
            ["Products / Orders / Customers", "Prodotti / Ordini / Clienti"],
            ["Published / Draft", "Pubblicato / Bozza"],
            ["Collection / Category", "Espansione / Categoria (micro prodotto)"],
            ["Variant", "Variante (per i sigillati ce n'è una sola: Default)"],
            ["Sales channel", "Canale di vendita (Website = il sito)"],
            ["Stock location", "Magazzino fisico"],
            ["Fulfillment", "Evasione / spedizione"],
            ["Refund", "Rimborso"],
            ["Region", "Zona di vendita (Italia, EUR)"],
          ]}
        />
      </Section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Guida",
})

export default GuidePage
