import type { CollectionConfig } from 'payload'
import { allowRead, denyAll } from '@/payload/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
  },
  upload: {
    imageSizes: [
      {
        name: 'card',
        width: 400,
        height: 400,
        position: 'centre',
      },
      {
        name: 'pdp',
        width: 900,
        height: 900,
        position: 'centre',
      },
    ],
  },
  access: {
    read: denyAll,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
