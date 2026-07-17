import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { fileURLToPath } from 'url'

import { Products } from './payload/collections/Products'
import { Categories } from './payload/collections/Categories'
import { Collections } from './payload/collections/Collections'
import { Orders } from './payload/collections/Orders'
import { Users } from './payload/collections/Users'
import { Media } from './payload/collections/Media'
import { SiteSettings } from './payload/globals/SiteSettings'
import { Header } from './payload/globals/Header'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: './app/(payload)/admin/importMap.js',
    },
  },
  collections: [Products, Categories, Collections, Orders, Users, Media],
  globals: [SiteSettings, Header],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-key-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
