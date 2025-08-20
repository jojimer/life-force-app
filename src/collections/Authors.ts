import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'booksCount'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the author',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the author name',
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
      name: 'bio',
      type: 'richText',
      admin: {
        description: 'Author biography',
      },
    },
    {
      name: 'photo',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'Author profile photo',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Author contact email',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Author website URL',
      },
    },
    {
      name: 'socialMedia',
      type: 'group',
      admin: {
        description: 'Social media links',
      },
      fields: [
        {
          name: 'twitter',
          type: 'text',
          admin: {
            placeholder: 'https://twitter.com/username',
          },
        },
        {
          name: 'facebook',
          type: 'text',
          admin: {
            placeholder: 'https://facebook.com/username',
          },
        },
        {
          name: 'instagram',
          type: 'text',
          admin: {
            placeholder: 'https://instagram.com/username',
          },
        },
        {
          name: 'linkedin',
          type: 'text',
          admin: {
            placeholder: 'https://linkedin.com/in/username',
          },
        },
      ],
    },
    {
      name: 'booksCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of books by this author',
      },
    },
  ],
}