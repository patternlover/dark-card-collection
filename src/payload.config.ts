import { buildConfig } from 'payload'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'path'
import { fileURLToPath } from 'url'

import { Products } from './payload/collections/Products'
import { Categories } from './payload/collections/Categories'
import { Users } from './payload/collections/Users'
import { Espansioni } from './payload/collections/Espansioni'
import { Orders } from './payload/collections/Orders'
import { Media } from './payload/collections/Media'
import { Messages } from './payload/collections/Messages'
import { Purchases } from './payload/collections/Purchases'
import { OperatingCosts } from './payload/collections/OperatingCosts'
import { SiteSettings } from './payload/globals/SiteSettings'
import { Header } from './payload/globals/Header'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    disable: true,
  },
  collections: [Users, Products, Categories, Espansioni, Orders, Media, Messages, Purchases, OperatingCosts],
  globals: [SiteSettings, Header],
  editor: lexicalEditor(),
  sharp,
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM || 'noreply@darkcardcollection.com',
        defaultFromName: 'Dark Card Collection',
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-key-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // push SOLO in dev: in produzione la schema è applicata dalle migration nel
    // build (`payload migrate`); push:true su Vercel farebbe una sync schema a ogni
    // cold-start (introspect + diff) rendendo lente/timeout le server actions.
    push: process.env.NODE_ENV !== 'production',
  }),
  plugins: (() => {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (blobToken && blobToken.startsWith('vercel_blob_rw_')) {
      return [
        vercelBlobStorage({
          collections: { media: { disablePayloadAccessControl: true } },
          token: blobToken,
        }),
      ]
    }
    return []
  })(),
})
