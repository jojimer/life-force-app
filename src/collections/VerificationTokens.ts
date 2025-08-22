import type { CollectionConfig } from 'payload'

export const VerificationTokens: CollectionConfig = {
  slug: 'verification-tokens',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'type', 'isUsed', 'expiresAt', 'createdAt'],
    group: 'User Data',
    description: 'Email verification tokens for user authentication',
  },
  access: {
    read: ({ req: { user } }) => !!user, // Only admin can read tokens
    create: () => true, // Allow API to create tokens
    update: ({ req: { user } }) => !!user, // Only admin can update
    delete: ({ req: { user } }) => !!user, // Only admin can delete
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Email address for verification',
      },
      index: true,
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique verification token',
        readOnly: true,
      },
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Email Verification', value: 'email-verification' },
        { label: 'Password Reset', value: 'password-reset' },
        { label: 'Progress Backup', value: 'progress-backup' },
        { label: 'Account Recovery', value: 'account-recovery' },
      ],
      defaultValue: 'email-verification',
      required: true,
      admin: {
        description: 'Type of verification token',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When this token expires',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      index: true,
    },
    {
      name: 'isUsed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this token has been used',
      },
      index: true,
    },
    {
      name: 'usedAt',
      type: 'date',
      admin: {
        description: 'When this token was used',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        condition: (data) => data.isUsed,
      },
    },
    {
      name: 'guestId',
      type: 'text',
      admin: {
        description: 'Associated guest ID for progress linking',
      },
      index: true,
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional token metadata (device info, etc.)',
      },
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of verification attempts',
        readOnly: true,
      },
    },
    {
      name: 'lastAttemptAt',
      type: 'date',
      admin: {
        description: 'Last verification attempt timestamp',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address when token was created',
        readOnly: true,
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent when token was created',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Set usedAt when isUsed becomes true
        if (data.isUsed && !data.usedAt) {
          data.usedAt = new Date().toISOString()
        }

        // Generate secure token for new tokens
        if (operation === 'create' && !data.token) {
          data.token = generateSecureToken()
        }

        // Set default expiration (24 hours for email verification, 1 hour for password reset)
        if (operation === 'create' && !data.expiresAt) {
          const hours = data.type === 'password-reset' ? 1 : 24
          data.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        }

        return data
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        // Log token creation for security monitoring
        if (operation === 'create') {
          console.log(`Verification token created for ${doc.email} (${doc.type})`)
        }

        // Log token usage
        if (doc.isUsed) {
          console.log(`Verification token used for ${doc.email} (${doc.type})`)
        }
      },
    ],
  },
  // Automatically clean up expired tokens
  endpoints: [
    {
      path: '/cleanup-expired',
      method: 'post',
      handler: async (req) => {
        const { payload } = req
        
        try {
          // Delete expired tokens
          const result = await payload.delete({
            collection: 'verification-tokens',
            where: {
              expiresAt: {
                less_than: new Date().toISOString(),
              },
            },
          })

          return Response.json({
            success: true,
            deletedCount: result.docs?.length || 0,
            message: 'Expired tokens cleaned up successfully',
          })
        } catch (error) {
          return Response.json({
            success: false,
            error: error.message,
          }, { status: 500 })
        }
      },
    },
  ],
  indexes: [
    {
      fields: ['email', 'type'],
    },
    {
      fields: ['token'],
      unique: true,
    },
    {
      fields: ['expiresAt'],
    },
    {
      fields: ['isUsed'],
    },
  ],
}

// Helper function to generate secure tokens
function generateSecureToken(): string {
  // Generate a cryptographically secure random token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  
  // Generate 32 character token
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Add timestamp for uniqueness
  return token + Date.now().toString(36)
}