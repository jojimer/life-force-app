import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { verifyToken, recordFailedAttempt } from '@/lib/verification-utils'
import { mergeProgressData } from '@/lib/progress-utils'

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
      const syncResult = await handleProgressBackupVerification(payload, result.tokenData, request)
      
      return NextResponse.json({
        success: true,
        message: 'Email verified and progress synced successfully',
        tokenData: {
          email: result.tokenData?.email,
          guestId: result.tokenData?.guestId,
          type: result.tokenData?.type,
        },
        syncStats: syncResult,
      })
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

async function handleProgressBackupVerification(payload: any, tokenData: any, request: NextRequest) {
  try {
    const { email, guestId } = tokenData
    
    // Get guest progress from request body if provided
    const body = await request.json().catch(() => ({}))
    const guestProgress = body.guestProgress || null

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
      const existingRecord = existingProgress.docs[0]
      
      // Merge guest progress with existing progress if provided
      let mergedProgress = existingRecord.progress
      if (guestProgress && guestProgress.books) {
        mergedProgress = mergeProgressData(existingRecord.progress, guestProgress)
      }
      
      const updatedRecord = await payload.update({
        collection: 'user-progress',
        id: existingRecord.id,
        data: {
          verified: true,
          verifiedAt: new Date().toISOString(),
          guestId: guestId || existingRecord.guestId,
          progress: mergedProgress,
          bookmarks: guestProgress?.bookmarks || existingRecord.bookmarks,
          preferences: guestProgress?.preferences || existingRecord.preferences,
          lastSyncAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          isActive: true,
          syncHistory: [
            ...(existingRecord.syncHistory || []),
            {
              syncedAt: new Date().toISOString(),
              syncType: 'full',
              deviceId: guestId,
              dataSize: JSON.stringify(guestProgress || {}).length,
            }
          ]
        },
      })
      
      return {
        action: 'updated',
        recordId: updatedRecord.id,
        syncedBooks: Object.keys(mergedProgress.books || {}).length,
        syncedBookmarks: (guestProgress?.bookmarks?.bookmarks || []).length,
      }
    } else {
      // Create new user progress record
      const defaultProgress = {
        books: {},
        currentlyReading: [],
        completed: [],
        lastActivity: null,
      }
      
      const defaultBookmarks = {
        bookmarks: [],
        notes: [],
        highlights: [],
      }
      
      const defaultPreferences = {
        theme: 'light',
        fontSize: 'medium',
        fontFamily: 'default',
        readingSpeed: 200,
        notifications: {
          email: true,
          reminders: false,
        },
      }
      
      const newRecord = await payload.create({
        collection: 'user-progress',
        data: {
          email,
          guestId: guestId || `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          verified: true,
          verifiedAt: new Date().toISOString(),
          progress: guestProgress || defaultProgress,
          bookmarks: guestProgress?.bookmarks || defaultBookmarks,
          preferences: guestProgress?.preferences || defaultPreferences,
          lastSyncAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          isActive: true,
          syncHistory: guestProgress ? [{
            syncedAt: new Date().toISOString(),
            syncType: 'full',
            deviceId: guestId,
            dataSize: JSON.stringify(guestProgress).length,
          }] : [],
        },
      })
      
      return {
        action: 'created',
        recordId: newRecord.id,
        syncedBooks: Object.keys((guestProgress?.books || {})).length,
        syncedBookmarks: (guestProgress?.bookmarks?.bookmarks || []).length,
      }
    }
  } catch (error) {
    console.error('Error handling progress backup verification:', error)
    throw error
  }
}