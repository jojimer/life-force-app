import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'featured', 'booksCount', 'updatedAt'],
    group: 'Content Management',
    description: 'Organize books by categories and genres',
    listSearchableFields: ['name', 'description'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Category name (e.g., Fiction, Science, History)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the category name',
      },
      hooks: {
        beforeValidate: [
          ({ data, operation }) => {
            if (operation === 'create' || operation === 'update') {
              if (data?.name && !data?.slug) {
                data.slug = data.name
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
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of this category',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code for category display (e.g., #FF5733)',
        placeholder: '#FF5733',
      },
    },
    {
      name: 'icon',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'Optional icon for the category',
      },
    },
    {
      name: 'parentCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category for hierarchical organization',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show this category prominently',
      },
    },
    {
      name: 'booksCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of books in this category',
      },
    },
  ],
}