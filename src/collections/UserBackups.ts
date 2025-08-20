import type { CollectionConfig } from 'payload'

export const UserBackups: CollectionConfig = {
  slug: 'user-backups',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'isVerified', 'lastSyncAt', 'createdAt'],
    group: 'User Data',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'User email for backup identification',
      },
    },
    {
      name: 'verificationToken',
      type: 'text',
      admin: {
        description: 'Token for email verification',
        readOnly: true,
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the email has been verified',
      },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      admin: {
        description: 'When the email was verified',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'progress',
      type: 'json',
      admin: {
        description: 'User reading progress data (JSON format)',
      },
    },
    {
      name: 'bookmarks',
      type: 'json',
      admin: {
        description: 'User bookmarks data (JSON format)',
      },
    },
    {
      name: 'preferences',
      type: 'json',
      admin: {
        description: 'User app preferences (theme, font size, etc.)',
      },
    },
    {
      name: 'lastSyncAt',
      type: 'date',
      admin: {
        description: 'Last time data was synced',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'deviceInfo',
      type: 'group',
      admin: {
        description: 'Information about the user device',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Web', value: 'web' },
            { label: 'iOS', value: 'ios' },
            { label: 'Android', value: 'android' },
          ],
        },
        {
          name: 'appVersion',
          type: 'text',
        },
        {
          name: 'deviceId',
          type: 'text',
          admin: {
            description: 'Unique device identifier',
          },
        },
      ],
    },
    {
      name: 'totalBooksRead',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total number of books completed',
      },
    },
    {
      name: 'totalReadingTime',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total reading time in minutes',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Set verifiedAt when isVerified becomes true
        if (data.isVerified && !data.verifiedAt) {
          data.verifiedAt = new Date().toISOString()
        }

        // Update lastSyncAt when progress or bookmarks are updated
        if (operation === 'update' && (data.progress || data.bookmarks)) {
          data.lastSyncAt = new Date().toISOString()
        }

        return data
      },
    ],
  },
}