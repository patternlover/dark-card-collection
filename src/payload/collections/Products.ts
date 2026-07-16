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
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Prezzo originale per mostrare sconto',
      },
    },
    {
      name: 'images',
      type: 'array',
      maxRows: 5,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'collections',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'in-stock',
      options: [
        { label: 'Disponibile', value: 'in-stock' },
        { label: 'Preordine', value: 'preorder' },
        { label: 'Esaurito', value: 'out-of-stock' },
      ],
    },
    {
      name: 'sealed',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Prodotto sigillato',
      },
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'feature',
          type: 'text',
        },
      ],
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      admin: {
        description: 'Peso in grammi per calcolo spedizione',
      },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'ID prezzo Stripe (creato automaticamente)',
      },
    },
    {
      name: 'isNew',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isBestseller',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Data di release (per preordini)',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
