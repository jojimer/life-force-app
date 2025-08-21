import type { CollectionConfig } from 'payload'

export const UserProgress: CollectionConfig = {
  slug: 'user-progress',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'guestId', 'verified', 'lastSyncAt', 'totalBooksRead'],
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
        description: 'User email for progress identification and backup',
      },
    },
    {
      name: 'guestId',
      type: 'text',
      required: true,
      admin: {
        description: 'Unique guest identifier for linking anonymous sessions',
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the email has been verified',
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
      required: true,
      admin: {
        description: 'User reading progress data (JSON structure)',
      },
      defaultValue: {
        books: {},
        currentlyReading: [],
        completed: [],
        lastActivity: null,
      },
    },
    {
      name: 'bookmarks',
      type: 'json',
      admin: {
        description: 'User bookmarks and saved positions',
      },
      defaultValue: {
        bookmarks: [],
        notes: [],
        highlights: [],
      },
    },
    {
      name: 'preferences',
      type: 'json',
      admin: {
        description: 'User app preferences and settings',
      },
      defaultValue: {
        theme: 'light',
        fontSize: 'medium',
        fontFamily: 'default',
        readingSpeed: 200,
        notifications: {
          email: true,
          reminders: false,
        },
      },
    },
    {
      name: 'statistics',
      type: 'group',
      admin: {
        description: 'Reading statistics and analytics',
      },
      fields: [
        {
          name: 'totalBooksRead',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Total number of books completed',
          },
        },
        {
          name: 'totalReadingTime',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Total reading time in minutes',
          },
        },
        {
          name: 'averageReadingSpeed',
          type: 'number',
          defaultValue: 200,
          admin: {
            description: 'Average words per minute',
          },
        },
        {
          name: 'longestStreak',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Longest consecutive reading days',
          },
        },
        {
          name: 'currentStreak',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Current consecutive reading days',
          },
        },
      ],
    },
    {
      name: 'deviceInfo',
      type: 'group',
      admin: {
        description: 'Information about user devices',
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
          admin: {
            description: 'App version when last synced',
          },
        },
        {
          name: 'deviceId',
          type: 'text',
          admin: {
            description: 'Unique device identifier',
          },
        },
        {
          name: 'userAgent',
          type: 'text',
          admin: {
            description: 'Browser/device user agent string',
          },
        },
      ],
    },
    {
      name: 'syncHistory',
      type: 'array',
      admin: {
        description: 'History of sync operations',
        readOnly: true,
      },
      fields: [
        {
          name: 'syncedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'syncType',
          type: 'select',
          options: [
            { label: 'Full Sync', value: 'full' },
            { label: 'Progress Update', value: 'progress' },
            { label: 'Preferences Update', value: 'preferences' },
            { label: 'Bookmarks Update', value: 'bookmarks' },
          ],
          required: true,
        },
        {
          name: 'deviceId',
          type: 'text',
        },
        {
          name: 'dataSize',
          type: 'number',
          admin: {
            description: 'Size of synced data in bytes',
          },
        },
      ],
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
      name: 'lastActivityAt',
      type: 'date',
      admin: {
        description: 'Last recorded user activity',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this user is currently active',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Set verifiedAt when verified becomes true
        if (data.verified && !data.verifiedAt) {
          data.verifiedAt = new Date().toISOString()
        }

        // Update lastSyncAt when progress or bookmarks are updated
        if (operation === 'update' && (data.progress || data.bookmarks || data.preferences)) {
          data.lastSyncAt = new Date().toISOString()
        }

        // Generate verification token for new unverified users
        if (operation === 'create' && !data.verified && !data.verificationToken) {
          data.verificationToken = generateVerificationToken()
        }

        // Update statistics from progress data
        if (data.progress?.completed) {
          data.statistics = {
            ...data.statistics,
            totalBooksRead: data.progress.completed.length,
          }
        }

        return data
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        // Send verification email for new users
        if (operation === 'create' && !doc.verified) {
          // TODO: Implement email sending logic
          console.log(`Verification email should be sent to: ${doc.email}`)
        }

        // Log sync activity
        if (operation === 'update') {
          console.log(`User progress synced for: ${doc.email}`)
        }
      },
    ],
  },
  indexes: [
    {
      fields: ['email'],
      unique: true,
    },
    {
      fields: ['guestId'],
    },
    {
      fields: ['verified'],
    },
    {
      fields: ['lastSyncAt'],
    },
  ],
}

// Helper function to generate verification tokens
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36)
}