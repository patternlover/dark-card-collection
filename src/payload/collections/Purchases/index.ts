import type { CollectionConfig } from 'payload'

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Titolo del prodotto acquistato',
      },
    },
    {
      name: 'cost_of_goods_sold',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Prezzo di acquisto unitario (€)',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 0,
      admin: {
        description: 'Quantità acquistata',
      },
    },
    {
      name: 'store',
      type: 'text',
      admin: {
        description: 'Luogo o fornitore (es. Edicola Via Roma, Supermercato X)',
      },
    },
    {
      name: 'purchase_date',
      type: 'date',
      admin: {
        description: 'Data di acquisto',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Note aggiuntive sull acquisto',
      },
    },
    {
      name: 'linked_product',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        description: 'Prodotto in inventario collegato',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Ricevuto / Caricato', value: 'received' },
        { label: 'In arrivo', value: 'pending' },
        { label: 'Archiviato', value: 'archived' },
      ],
      defaultValue: 'received',
    },
  ],
}
