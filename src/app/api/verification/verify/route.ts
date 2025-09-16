import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { verifyToken, recordFailedAttempt } from '@/lib/verification-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, type = 'progress-backup' } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code format' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })
    
    // Verify the token
    const result = await verifyToken(payload, token, type)

    if (!result.isValid) {
      // Record failed attempt
      await recordFailedAttempt(payload, token)
      
      return NextResponse.json(
        { success: false, message: result.error || 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Token is valid - now handle the verification based on type
    if (type === 'progress-backup' && result.tokenData) {
      // Create or update user progress record
      await handleProgressBackupVerification(payload, result.tokenData)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      tokenData: {
        email: result.tokenData?.email,
        guestId: result.tokenData?.guestId,
        type: result.tokenData?.type,
      },
    })

  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    )
  }
}

async function handleProgressBackupVerification(payload: any, tokenData: any) {
  try {
    const { email, guestId } = tokenData

    // Check if user progress record already exists
    const existingProgress = await payload.find({
      collection: 'user-progress',
      where: {
        email: { equals: email },
      },
      limit: 1,
    })

    if (existingProgress.docs && existingProgress.docs.length > 0) {
      // Update existing record
      await payload.update({
        collection: 'user-progress',
        id: existingProgress.docs[0].id,
        data: {
          verified: true,
          verifiedAt: new Date().toISOString(),
          guestId: guestId || existingProgress.docs[0].guestId,
          lastSyncAt: new Date().toISOString(),
        },
      })
    } else {
      // Create new user progress record
      await payload.create({
        collection: 'user-progress',
        data: {
          email,
          guestId: guestId || `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          verified: true,
          verifiedAt: new Date().toISOString(),
          progress: {
            books: {},
            currentlyReading: [],
            completed: [],
            lastActivity: null,
          },
          bookmarks: {
            bookmarks: [],
            notes: [],
            highlights: [],
          },
          preferences: {
            theme: 'light',
            fontSize: 'medium',
            fontFamily: 'default',
            readingSpeed: 200,
            notifications: {
              email: true,
              reminders: false,
            },
          },
          lastSyncAt: new Date().toISOString(),
        },
      })
    }
  } catch (error) {
    console.error('Error handling progress backup verification:', error)
    // Don't throw - verification was successful, this is just a bonus feature
  }
}