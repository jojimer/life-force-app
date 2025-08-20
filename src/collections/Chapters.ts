import type { CollectionConfig } from 'payload'

export const Chapters: CollectionConfig = {
  slug: 'chapters',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'book', 'chapterNumber', 'status'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Chapter title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL-friendly version of the chapter title',
      },
      hooks: {
        beforeValidate: [
          ({ data, operation }) => {
            if (operation === 'create' || operation === 'update') {
              if (data?.title && !data?.slug) {
                data.slug = data.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '')
              }
            }
            return data
          },
        ],
      },
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
      admin: {
        description: 'The book this chapter belongs to',
      },
    },
    {
      name: 'chapterNumber',
      type: 'number',
      required: true,
      admin: {
        description: 'Chapter order/number within the book',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The full content of this chapter',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Brief chapter summary or excerpt',
      },
    },
    {
      name: 'wordCount',
      type: 'number',
      admin: {
        description: 'Approximate word count for this chapter',
        readOnly: true,
      },
    },
    {
      name: 'estimatedReadingTime',
      type: 'number',
      admin: {
        description: 'Estimated reading time in minutes',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        description: 'Publication status of the chapter',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'When this chapter was published',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark as featured chapter (for previews, etc.)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for editors/authors',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Chapter-specific tags for organization',
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
      name: 'readingProgress',
      type: 'group',
      admin: {
        description: 'Reading progress tracking metadata',
      },
      fields: [
        {
          name: 'averageReadingTime',
          type: 'number',
          admin: {
            description: 'Average time users spend reading this chapter (minutes)',
            readOnly: true,
          },
        },
        {
          name: 'completionRate',
          type: 'number',
          admin: {
            description: 'Percentage of users who complete this chapter',
            readOnly: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-generate slug if not provided
        if (operation === 'create' && data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }

        // Calculate estimated reading time (assuming 200 words per minute)
        if (data.content && data.wordCount) {
          data.estimatedReadingTime = Math.ceil(data.wordCount / 200)
        }

        // Set publishedAt when status changes to published
        if (data.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }

        return data
      },
    ],
  ],
  indexes: [
    {
      fields: ['book', 'chapterNumber'],
      unique: true,
    },
  ],
}