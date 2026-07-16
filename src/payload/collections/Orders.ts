import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'stripeSessionId',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'stripePaymentIntent',
      type: 'text',
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
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
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'In attesa', value: 'pending' },
        { label: 'Pagato', value: 'paid' },
        { label: 'Spedito', value: 'shipped' },
        { label: 'Consegnato', value: 'delivered' },
        { label: 'Annullato', value: 'cancelled' },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'address', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
        { name: 'country', type: 'text', required: true },
      ],
    },
    {
      name: 'total',
      type: 'number',
      required: true,
    },
  ],
}
