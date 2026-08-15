import type {
  CollectionConfig,
  CollectionBeforeChangeHook,
} from 'payload'
import { allowRead, denyAll } from '@/payload/access'
import { computeEffectiveUnitCosts, roundMoney } from '@/lib/purchase-math'

interface PurchaseLineInput {
  id?: string
  product?: unknown
  quantity?: number
  unit_cost?: number
  effective_unit_cost?: number
  remaining_quantity?: number
}

const beforeChange: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (data.lines === undefined && data.extra_costs === undefined) return data

  const prevLines = ((originalDoc as { lines?: PurchaseLineInput[] } | undefined)?.lines ?? []) as PurchaseLineInput[]
  const prevById = new Map(prevLines.map((line) => [line.id, line]))
  const incoming = (data.lines ?? prevLines) as PurchaseLineInput[]

  const extraCosts =
    data.extra_costs !== undefined ? Number(data.extra_costs) || 0 : Number((originalDoc as { extra_costs?: number } | undefined)?.extra_costs ?? 0) || 0

  const { effectiveCosts, totalCost } = computeEffectiveUnitCosts(
    incoming.map((line) => ({
      quantity: Number(line.quantity ?? 0),
      unit_cost: Number(line.unit_cost ?? 0),
    })),
    extraCosts,
  )

  data.lines = incoming.map((line, index) => {
    const previous = line.id ? prevById.get(line.id) : undefined
    const quantity = Number(line.quantity ?? 0)
    const remaining = line.remaining_quantity ?? previous?.remaining_quantity
    return {
      ...line,
      effective_unit_cost: roundMoney(effectiveCosts[index] ?? 0),
      remaining_quantity: remaining === undefined ? quantity : Number(remaining),
    }
  })
  data.total_cost = roundMoney(totalCost)
  return data
}

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'source_name',
  },
  access: {
    read: denyAll,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    {
      name: 'purchase_date',
      type: 'date',
      required: true,
      admin: {
        description: 'Data di acquisto del lotto',
      },
    },
    {
      name: 'source_type',
      type: 'select',
      options: [
        { label: 'Edicola', value: 'newsstand' },
        { label: 'Supermercato', value: 'supermarket' },
        { label: 'Negozio', value: 'shop' },
        { label: 'Online', value: 'online' },
        { label: 'Privato', value: 'private' },
        { label: 'Altro', value: 'other' },
      ],
      admin: {
        description: 'Tipologia di fonte di acquisto',
      },
    },
    {
      name: 'source_name',
      type: 'text',
      admin: {
        description: 'Luogo o fornitore (es. Esselunga Viale X, edicola Piazza Y)',
      },
    },
    {
      name: 'extra_costs',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Spese extra sull\'intero lotto (spedizione, commissioni) — ripartite pro-quota sul valore delle righe',
      },
    },
    {
      name: 'receipt_file_id',
      type: 'text',
      admin: {
        description: 'ID del file scontrino su Google Drive',
      },
    },
    {
      name: 'receipt_name',
      type: 'text',
      admin: {
        description: 'Nome originale del file scontrino caricato',
      },
    },
    {
      name: 'receipt_url',
      type: 'text',
      admin: {
        description: 'Link di visualizzazione dello scontrino su Google Drive',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Note aggiuntive sul lotto',
      },
    },
    {
      name: 'lines',
      type: 'array',
      label: 'Righe',
      admin: {
        description: 'Righe del lotto: prodotto, quantità e costo unitario',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'unit_cost',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Costo di acquisto unitario (€)',
          },
        },
        {
          name: 'effective_unit_cost',
          type: 'number',
          min: 0,
          admin: {
            readOnly: true,
            description: 'Costo unitario effettivo con extra_costs ripartiti (auto-calcolato)',
          },
        },
        {
          name: 'remaining_quantity',
          type: 'number',
          min: 0,
          admin: {
            readOnly: true,
            description: 'Quantità ancora in magazzino da questo lotto (consumata FIFO dalle vendite)',
          },
        },
      ],
    },
    {
      name: 'total_cost',
      type: 'number',
      min: 0,
      admin: {
        readOnly: true,
        description: 'Costo totale del lotto: Σ (qty × unit_cost) + extra_costs (auto-calcolato)',
      },
    },
  ],
  hooks: {
    beforeChange: [beforeChange],
  },
}
