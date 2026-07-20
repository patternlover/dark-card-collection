import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
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
      name: 'itemId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Unique identifier from Google Sheets (e.g. PUR-0001-01)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'storePrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Actual selling price in the store',
      },
    },
    {
      name: 'price',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Purchase cost (from Google Sheets)',
      },
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Target price / strikethrough price',
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
      name: 'productState',
      type: 'text',
      admin: {
        description: 'Raw product_state from Google Sheets (e.g. LISTED, HOLD, WATCH)',
      },
    },
    {
      name: 'condition',
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
      name: 'cardNumber',
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
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Direct product image URL (e.g. from Cardmarket)',
      },
    },
    {
      name: 'images',
      type: 'array',
      admin: {
        description: 'Additional product images (uploaded via admin)',
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
      name: 'averageSalePrice',
      type: 'number',
      admin: {
        description: 'Average selling price from sales history (auto-calculated)',
        readOnly: true,
      },
    },
    {
      name: 'lastPriceUpdate',
      type: 'date',
      admin: {
        description: 'Last time average price was recalculated',
        readOnly: true,
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostra il prodotto nello shop (indipendente dallo stato)',
      },
    },
  ],
}
