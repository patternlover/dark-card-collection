import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'transaction_id',
  },
  fields: [
    {
      name: 'transaction_id',
      type: 'text',
      required: true,
    },
    {
      name: 'sales_channel',
      type: 'select',
      options: [
        { label: 'Sito web', value: 'website' },
        { label: 'Vinted', value: 'vinted' },
        { label: 'eBay', value: 'ebay' },
        { label: 'Cardmarket', value: 'cardmarket' },
        { label: 'Altro', value: 'other' },
      ],
      defaultValue: 'website',
      admin: {
        description: 'Canale di vendita: website (webhook Stripe) o piattaforma esterna',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'items',
      type: 'array',
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
          name: 'price',
          type: 'number',
          required: true,
        },
        {
          name: 'unit_cost_snapshot',
          type: 'number',
          min: 0,
          admin: {
            description: 'Costo unitario effettivo al momento della vendita (snapshot FIFO)',
          },
        },
      ],
    },
    {
      name: 'value',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'EUR',
    },
    {
      name: 'shipping',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'tax',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'stripe_session_id',
      type: 'text',
      unique: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
  ],
}
