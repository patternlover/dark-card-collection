import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { allowRead, denyAll } from '@/payload/access'

const beforeChange: CollectionBeforeChangeHook = ({ data, originalDoc, operation }) => {
  if (data.quantity === undefined) return data

  const previous = (originalDoc as
    | { status?: string; availability?: string; quantity?: number; is_preorder?: boolean }
    | undefined)
  const quantity = Number(data.quantity)
  const previousQuantity = Number(previous?.quantity ?? 0)

  if (quantity <= 0) {
    data.status = 'sold'
    data.availability = 'out_of_stock'
    return data
  }

  const isPreorder = data.is_preorder === undefined ? Boolean(previous?.is_preorder) : Boolean(data.is_preorder)
  data.availability = isPreorder ? 'preorder' : 'in_stock'
  if (operation === 'update' && previousQuantity <= 0 && previous?.status === 'sold') {
    data.status = 'listed'
  }
  return data
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    beforeChange: [beforeChange],
  },
  access: {
    read: allowRead,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'item_group_id',
      type: 'text',
      admin: {
        description: 'Google Merchant item_group_id: chiave della carta (varianti dello stesso prodotto)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'price',
      type: 'number',
      min: 0,
      admin: {
        description: 'Prezzo di vendita (Merchant price)',
      },
    },
    {
      name: 'sale_price',
      type: 'number',
      min: 0,
      admin: {
        description: 'Prezzo di confronto / barrato (Merchant sale_price)',
      },
    },
    {
      name: 'cost_of_goods_sold',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Costo medio ponderato dalle righe d\'acquisto (auto-calcolato da Purchases, non editabile)',
        readOnly: true,
      },
    },
    {
      name: 'availability',
      type: 'select',
      options: [
        { label: 'In stock', value: 'in_stock' },
        { label: 'Out of stock', value: 'out_of_stock' },
        { label: 'Preorder', value: 'preorder' },
        { label: 'Backorder', value: 'backorder' },
      ],
      defaultValue: 'in_stock',
      admin: {
        description: 'Disponibilità Google (auto da status, quantity e is_preorder)',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Disponibile', value: 'listed' },
        { label: 'In Attesa', value: 'hold' },
        { label: 'Venduto', value: 'sold' },
      ],
      defaultValue: 'listed',
    },
    {
      name: 'condition',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Refurbished', value: 'refurbished' },
        { label: 'Used', value: 'used' },
      ],
      defaultValue: 'used',
      admin: {
        description: 'Condizione Google (sealed = new, carte singole = used)',
      },
    },
    {
      name: 'grade',
      type: 'select',
      options: [
        { label: 'Mint', value: 'mint' },
        { label: 'Near Mint', value: 'near-mint' },
        { label: 'Lightly Played', value: 'lightly-played' },
        { label: 'Moderately Played', value: 'moderately-played' },
        { label: 'Heavily Played', value: 'heavily-played' },
        { label: 'Damaged', value: 'damaged' },
        { label: 'Graded', value: 'graded' },
      ],
      defaultValue: 'near-mint',
      admin: {
        description: 'Grado della carta (TCG)',
      },
    },
    {
      name: 'is_preorder',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Prodotto in pre-ordine (In Attesa): visibile in /shop/preorders e acquistabile',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'collections',
    },
    {
      name: 'product_type',
      type: 'text',
      admin: {
        description: 'Merchant product_type (es. nome collezione/categoria)',
      },
    },
    {
      name: 'google_product_category',
      type: 'text',
      admin: {
        description: 'Merchant google_product_category (ID o percorso tassonomia Google)',
      },
    },
    {
      name: 'language',
      type: 'select',
      options: [
        { label: 'Italiano', value: 'italian' },
        { label: 'Inglese', value: 'english' },
        { label: 'Cinese', value: 'chinese' },
        { label: 'Giapponese', value: 'japanese' },
      ],
      defaultValue: 'italian',
    },
    {
      name: 'card_number',
      type: 'text',
    },
    {
      name: 'rarity',
      type: 'select',
      options: [
        { label: 'Common', value: 'common' },
        { label: 'Uncommon', value: 'uncommon' },
        { label: 'Rare', value: 'rare' },
        { label: 'Rare Holo', value: 'rare-holo' },
        { label: 'Ultra Rare', value: 'ultra-rare' },
        { label: 'Secret Rare', value: 'secret-rare' },
      ],
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 1,
      min: 0,
    },
    {
      name: 'image_link',
      type: 'text',
      admin: {
        description: 'URL immagine principale (Merchant image_link, es. da Cardmarket)',
      },
    },
    {
      name: 'images',
      type: 'array',
      admin: {
        description: 'Immagini aggiuntive (upload via dashboard)',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'average_sale_price',
      type: 'number',
      admin: {
        description: 'Prezzo medio di vendita storico (auto-calcolato)',
        readOnly: true,
      },
    },
    {
      name: 'last_price_update',
      type: 'date',
      admin: {
        description: 'Ultima ricalcolazione del prezzo medio',
        readOnly: true,
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'is_visible',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostra il prodotto nello shop (indipendente dallo stato)',
      },
    },
  ],
}
