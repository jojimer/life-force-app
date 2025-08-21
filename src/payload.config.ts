// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Books } from './collections/Books'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Chapters } from './collections/Chapters'
import { UserBackups } from './collections/UserBackups'
import { UserProgress } from './collections/UserProgress'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Book Publishing Platform',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  collections: [Users, Media, Books, Authors, Categories, Chapters, UserBackups],
  collections: [Users, Media, Books, Authors, Categories, Chapters, UserBackups, UserProgress],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  upload: {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB for book files and high-res images
    },
  },
  cors: [
    'http://localhost:3000',
    'https://your-domain.com', // Replace with your actual domain
  ],
  csrf: [
    'http://localhost:3000',
    'https://your-domain.com', // Replace with your actual domain
  ],
  plugins: [
    payloadCloudPlugin(),
    // S3 Storage (optional - configure with environment variables)
    ...(process.env.S3_BUCKET ? [
      s3Storage({
        collections: {
          media: {
            prefix: 'media',
          },
        },
        bucket: process.env.S3_BUCKET,
        config: {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
          region: process.env.S3_REGION || 'us-east-1',
          ...(process.env.S3_ENDPOINT && {
            endpoint: process.env.S3_ENDPOINT,
            forcePathStyle: true,
          }),
        },
      })
    ] : []),
  ],
})
