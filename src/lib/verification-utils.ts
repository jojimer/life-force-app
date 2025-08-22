/**
 * Utilities for managing email verification tokens
 */

export interface VerificationTokenData {
  email: string
  token: string
  type: 'email-verification' | 'password-reset' | 'progress-backup' | 'account-recovery'
  expiresAt: string
  guestId?: string
  metadata?: any
}

/**
 * Create a new verification token
 */
export async function createVerificationToken(
  payload: any,
  data: {
    email: string
    type?: VerificationTokenData['type']
    guestId?: string
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }
): Promise<VerificationTokenData> {
  try {
    // Check for existing unused tokens for this email and type
    const existingTokens = await payload.find({
      collection: 'verification-tokens',
      where: {
        and: [
          { email: { equals: data.email } },
          { type: { equals: data.type || 'email-verification' } },
          { isUsed: { equals: false } },
          { expiresAt: { greater_than: new Date().toISOString() } },
        ],
      },
    })

    // If there's an existing valid token, return it
    if (existingTokens.docs && existingTokens.docs.length > 0) {
      return existingTokens.docs[0]
    }

    // Create new token
    const result = await payload.create({
      collection: 'verification-tokens',
      data: {
        email: data.email,
        type: data.type || 'email-verification',
        guestId: data.guestId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    return result
  } catch (error) {
    console.error('Error creating verification token:', error)
    throw new Error('Failed to create verification token')
  }
}

/**
 * Verify a token and mark it as used
 */
export async function verifyToken(
  payload: any,
  token: string,
  type?: VerificationTokenData['type']
): Promise<{
  isValid: boolean
  tokenData?: VerificationTokenData
  error?: string
}> {
  try {
    // Find the token
    const tokenQuery: any = {
      and: [
        { token: { equals: token } },
        { isUsed: { equals: false } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    }

    if (type) {
      tokenQuery.and.push({ type: { equals: type } })
    }

    const result = await payload.find({
      collection: 'verification-tokens',
      where: tokenQuery,
    })

    if (!result.docs || result.docs.length === 0) {
      return {
        isValid: false,
        error: 'Invalid or expired token',
      }
    }

    const tokenData = result.docs[0]

    // Mark token as used
    await payload.update({
      collection: 'verification-tokens',
      id: tokenData.id,
      data: {
        isUsed: true,
        usedAt: new Date().toISOString(),
      },
    })

    return {
      isValid: true,
      tokenData,
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return {
      isValid: false,
      error: 'Token verification failed',
    }
  }
}

/**
 * Record a failed verification attempt
 */
export async function recordFailedAttempt(
  payload: any,
  token: string
): Promise<void> {
  try {
    const result = await payload.find({
      collection: 'verification-tokens',
      where: {
        token: { equals: token },
      },
    })

    if (result.docs && result.docs.length > 0) {
      const tokenData = result.docs[0]
      await payload.update({
        collection: 'verification-tokens',
        id: tokenData.id,
        data: {
          attempts: (tokenData.attempts || 0) + 1,
          lastAttemptAt: new Date().toISOString(),
        },
      })
    }
  } catch (error) {
    console.error('Error recording failed attempt:', error)
  }
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(payload: any): Promise<number> {
  try {
    const result = await payload.delete({
      collection: 'verification-tokens',
      where: {
        expiresAt: {
          less_than: new Date().toISOString(),
        },
      },
    })

    return result.docs?.length || 0
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error)
    return 0
  }
}

/**
 * Generate verification URL
 */
export function generateVerificationUrl(
  baseUrl: string,
  token: string,
  type: VerificationTokenData['type'] = 'email-verification'
): string {
  const paths = {
    'email-verification': '/verify-email',
    'password-reset': '/reset-password',
    'progress-backup': '/restore-progress',
    'account-recovery': '/recover-account',
  }

  const path = paths[type] || '/verify-email'
  return `${baseUrl}${path}?token=${token}`
}

/**
 * Check if email has pending verification
 */
export async function hasPendingVerification(
  payload: any,
  email: string,
  type: VerificationTokenData['type'] = 'email-verification'
): Promise<boolean> {
  try {
    const result = await payload.find({
      collection: 'verification-tokens',
      where: {
        and: [
          { email: { equals: email } },
          { type: { equals: type } },
          { isUsed: { equals: false } },
          { expiresAt: { greater_than: new Date().toISOString() } },
        ],
      },
    })

    return result.docs && result.docs.length > 0
  } catch (error) {
    console.error('Error checking pending verification:', error)
    return false
  }
}

/**
 * Get token statistics for monitoring
 */
export async function getTokenStatistics(payload: any): Promise<{
  total: number
  active: number
  expired: number
  used: number
  byType: Record<string, number>
}> {
  try {
    const [total, active, expired, used] = await Promise.all([
      payload.count({ collection: 'verification-tokens' }),
      payload.count({
        collection: 'verification-tokens',
        where: {
          and: [
            { isUsed: { equals: false } },
            { expiresAt: { greater_than: new Date().toISOString() } },
          ],
        },
      }),
      payload.count({
        collection: 'verification-tokens',
        where: {
          expiresAt: { less_than: new Date().toISOString() },
        },
      }),
      payload.count({
        collection: 'verification-tokens',
        where: { isUsed: { equals: true } },
      }),
    ])

    // Get counts by type
    const types = ['email-verification', 'password-reset', 'progress-backup', 'account-recovery']
    const byType: Record<string, number> = {}

    for (const type of types) {
      const count = await payload.count({
        collection: 'verification-tokens',
        where: { type: { equals: type } },
      })
      byType[type] = count.totalDocs
    }

    return {
      total: total.totalDocs,
      active: active.totalDocs,
      expired: expired.totalDocs,
      used: used.totalDocs,
      byType,
    }
  } catch (error) {
    console.error('Error getting token statistics:', error)
    return {
      total: 0,
      active: 0,
      expired: 0,
      used: 0,
      byType: {},
    }
  }
}