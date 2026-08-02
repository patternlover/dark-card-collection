import type { CollectionConfig } from 'payload'

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
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
