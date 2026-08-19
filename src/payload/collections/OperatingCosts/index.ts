import type { CollectionConfig } from 'payload'
import { denyAll, allowRead } from '@/payload/access'

export const OperatingCosts: CollectionConfig = {
  slug: 'operating-costs',
  admin: {
    useAsTitle: 'description',
  },
  access: {
    read: allowRead,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Es. Dominio, OpenCode, Vercel, Stripe fees',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Importo mensile in €',
      },
    },
    {
      name: 'frequency',
      type: 'select',
      options: [
        { label: 'Mensile', value: 'monthly' },
        { label: 'Trimestrale', value: 'quarterly' },
        { label: 'Annuale', value: 'yearly' },
      ],
      defaultValue: 'monthly',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Hosting/Dominio', value: 'hosting' },
        { label: 'Software', value: 'software' },
        { label: 'Commissioni', value: 'fees' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Altro', value: 'other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Deseleziona per disattivare senza eliminare',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
