import type { CollectionConfig } from 'payload'
import { allowRead, denyAll } from '@/payload/access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: allowRead,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    {
      name: 'name',
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
      name: 'kind',
      type: 'select',
      options: [
        { label: 'Prodotto', value: 'product' },
        { label: 'Carta', value: 'card' },
        { label: 'Entrambi', value: 'both' },
      ],
      defaultValue: 'both',
      admin: {
        description: 'Tipo di articolo a cui si applica questa categoria micro (prodotto sigillato, carta singola o entrambi)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
