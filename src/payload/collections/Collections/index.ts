import type { CollectionConfig } from 'payload'
import { allowRead, denyAll } from '@/payload/access'

export const Collections: CollectionConfig = {
  slug: 'collections',
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'releaseDate',
      type: 'date',
    },
  ],
}
