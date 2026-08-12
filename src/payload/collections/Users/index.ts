import type { CollectionConfig } from 'payload'
import { denyAll } from '@/payload/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: denyAll,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  fields: [],
}
