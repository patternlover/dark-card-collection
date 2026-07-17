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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
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
      ],
      defaultValue: 'near-mint',
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
      name: 'language',
      type: 'select',
      options: [
        { label: 'Italiano', value: 'italian' },
        { label: 'Inglese', value: 'english' },
        { label: 'Giapponese', value: 'japanese' },
      ],
      defaultValue: 'italian',
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 1,
      min: 0,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
