import type { CollectionConfig } from 'payload'

export const Books: CollectionConfig = {
  slug: 'books',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'featured', 'chaptersCount', 'updatedAt'],
    group: 'Content Management',
    description: 'Manage your book catalog, authors, and publication details',
    pagination: {
      defaultLimit: 20,
    },
    listSearchableFields: ['title', 'isbn'],
    preview: (doc) => {
      return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/books/${doc.slug}`
    },
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
        description: 'The title of the book',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the title',
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
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      admin: {
        description: 'The author of this book',
      },
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Cover image for the book',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'Book description or synopsis',
      },
    },
    {
      name: 'publicationDate',
      type: 'date',
      required: true,
      admin: {
        description: 'When the book was published',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'isbn',
      type: 'text',
      admin: {
        description: 'International Standard Book Number',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Book categories/genres',
      },
    },
    {
      name: 'language',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Italian', value: 'it' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'en',
      required: true,
    },
    {
      name: 'pageCount',
      type: 'number',
      admin: {
        description: 'Number of pages in the book',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        description: 'Publication status of the book',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark as featured book',
      },
    },
    {
      name: 'chaptersCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of chapters in this book',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Additional tags for search and filtering',
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
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of times this book has been downloaded',
      },
    },
    {
      name: 'averageRating',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Average user rating (calculated field)',
      },
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
        return data
      },
    ],
  },
}