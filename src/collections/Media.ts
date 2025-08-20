import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    group: 'Assets',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  upload: {
    // Configure image sizes for different use cases
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 200,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
      {
        name: 'card',
        width: 300,
        height: 400,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'cover',
        width: 600,
        height: 800,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 90,
          },
        },
      },
      {
        name: 'hero',
        width: 1200,
        height: 800,
        position: 'centre',
        crop: 'focalpoint',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'mobile',
        width: 400,
        height: 533,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
    ],
    // File validation
    mimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf', // For book files
      'application/epub+zip', // For EPUB files
    ],
    // File size limits (in bytes)
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    // Disable file uploads that don't match criteria
    disableLocalStorage: false,
    // Configure upload directory structure
    staticDir: 'media',
    // Enable focal point selection for better cropping
    focalPoint: true,
    // Crop settings
    crop: true,
    // Format options for original images
    formatOptions: {
      format: 'webp',
      options: {
        quality: 95,
      },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility and SEO',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Image caption or description',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Book Cover', value: 'book-cover' },
        { label: 'Author Photo', value: 'author-photo' },
        { label: 'Category Icon', value: 'category-icon' },
        { label: 'Chapter Image', value: 'chapter-image' },
        { label: 'Hero Image', value: 'hero' },
        { label: 'Thumbnail', value: 'thumbnail' },
        { label: 'Document', value: 'document' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'other',
      admin: {
        description: 'Type of media asset for better organization',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags for organizing and searching media',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'photographer',
      type: 'text',
      admin: {
        description: 'Photographer or image source credit',
      },
    },
    {
      name: 'license',
      type: 'select',
      options: [
        { label: 'All Rights Reserved', value: 'all-rights-reserved' },
        { label: 'Creative Commons', value: 'creative-commons' },
        { label: 'Public Domain', value: 'public-domain' },
        { label: 'Stock Photo', value: 'stock-photo' },
        { label: 'Custom License', value: 'custom' },
      ],
      admin: {
        description: 'Image licensing information',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark as featured media for easy access',
      },
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'SEO optimization settings',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'SEO title for the image',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'SEO description for the image',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          admin: {
            description: 'SEO keywords (comma-separated)',
          },
        },
      ],
    },
    {
      name: 'usage',
      type: 'group',
      admin: {
        description: 'Usage tracking and metadata',
      },
      fields: [
        {
          name: 'downloadCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of times downloaded',
          },
        },
        {
          name: 'lastUsed',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Last time this media was used',
          },
        },
        {
          name: 'usedIn',
          type: 'array',
          admin: {
            readOnly: true,
            description: 'Collections where this media is used',
          },
          fields: [
            {
              name: 'collection',
              type: 'text',
            },
            {
              name: 'documentId',
              type: 'text',
            },
            {
              name: 'field',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-generate alt text from filename if not provided
        if (operation === 'create' && !data.alt && data.filename) {
          data.alt = data.filename
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
            .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
        }

        // Set SEO title from alt if not provided
        if (!data.seo?.title && data.alt) {
          data.seo = {
            ...data.seo,
            title: data.alt,
          }
        }

        return data
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        // Log media creation/updates for analytics
        if (operation === 'create') {
          console.log(`New media uploaded: ${doc.filename} (${doc.mimeType})`)
        }
      },
    ],
  },
}