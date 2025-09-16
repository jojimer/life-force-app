import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { mergeProgressData, validateProgressData } from '@/lib/progress-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      guestId, 
      progress, 
      bookmarks, 
      preferences,
      deviceInfo,
      force = false 
    } = body

    if (!email || !guestId) {
      return NextResponse.json(
        { success: false, message: 'Email and guest ID are required' },
        { status: 400 }
      )
    }

    // Validate progress data structure
    if (progress && !validateProgressData(progress)) {
      return NextResponse.json(
        { success: false, message: 'Invalid progress data format' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })

    // Find existing user progress record
    const existingProgress = await payload.find({
      collection: 'user-progress',
      where: {
        or: [
          { email: { equals: email } },
          { guestId: { equals: guestId } }
        ]
      },
      limit: 1,
    })

    const now = new Date().toISOString()
    const syncRecord = {
      syncedAt: now,
      syncType: 'full' as const,
      deviceId: guestId,
      dataSize: JSON.stringify({ progress, bookmarks, preferences }).length,
    }

    if (existingProgress.docs && existingProgress.docs.length > 0) {
      // Update existing record
      const existingRecord = existingProgress.docs[0]
      
      // Merge progress data unless force sync is requested
      let mergedProgress = progress
      if (!force && existingRecord.progress) {
        mergedProgress = mergeProgressData(existingRecord.progress, progress)
      }

      const updatedRecord = await payload.update({
        collection: 'user-progress',
        id: existingRecord.id,
        data: {
          email,
          guestId,
          progress: mergedProgress,
          bookmarks: bookmarks || existingRecord.bookmarks,
          preferences: preferences || existingRecord.preferences,
          deviceInfo: deviceInfo || existingRecord.deviceInfo,
          lastSyncAt: now,
          lastActivityAt: now,
          isActive: true,
          syncHistory: [
            ...(existingRecord.syncHistory || []).slice(-9), // Keep last 10 entries
            syncRecord
          ],
          // Update statistics
          statistics: {
            ...existingRecord.statistics,
            totalBooksRead: mergedProgress?.completed?.length || 0,
            totalReadingTime: calculateTotalReadingTime(mergedProgress),
          }
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Progress synced successfully',
        data: {
          id: updatedRecord.id,
          email: updatedRecord.email,
          lastSyncAt: updatedRecord.lastSyncAt,
          syncStats: {
            booksCount: Object.keys(mergedProgress?.books || {}).length,
            bookmarksCount: (bookmarks?.bookmarks || []).length,
            action: 'updated'
          }
        }
      })
    } else {
      // Create new user progress record
      const newRecord = await payload.create({
        collection: 'user-progress',
        data: {
          email,
          guestId,
          verified: false, // Will be verified through email verification flow
          progress: progress || {
            books: {},
            currentlyReading: [],
            completed: [],
            lastActivity: null,
          },
          bookmarks: bookmarks || {
            bookmarks: [],
            notes: [],
            highlights: [],
          },
          preferences: preferences || {
            theme: 'light',
            fontSize: 'medium',
            fontFamily: 'default',
            readingSpeed: 200,
            notifications: {
              email: true,
              reminders: false,
            },
          },
          deviceInfo: deviceInfo || {
            platform: 'web',
            appVersion: '1.0.0',
          },
          statistics: {
            totalBooksRead: progress?.completed?.length || 0,
            totalReadingTime: calculateTotalReadingTime(progress),
            averageReadingSpeed: 200,
            longestStreak: 0,
            currentStreak: 0,
          },
          lastSyncAt: now,
          lastActivityAt: now,
          isActive: true,
          syncHistory: [syncRecord],
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Progress record created successfully',
        data: {
          id: newRecord.id,
          email: newRecord.email,
          lastSyncAt: newRecord.lastSyncAt,
          syncStats: {
            booksCount: Object.keys(progress?.books || {}).length,
            bookmarksCount: (bookmarks?.bookmarks || []).length,
            action: 'created'
          }
        }
      })
    }

  } catch (error) {
    console.error('Error syncing user progress:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to sync progress' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const guestId = searchParams.get('guestId')

    if (!email && !guestId) {
      return NextResponse.json(
        { success: false, message: 'Email or guest ID is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })

    const whereClause = email 
      ? { email: { equals: email } }
      : { guestId: { equals: guestId } }

    const userProgress = await payload.find({
      collection: 'user-progress',
      where: whereClause,
      limit: 1,
    })

    if (!userProgress.docs || userProgress.docs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No progress found for this user',
      }, { status: 404 })
    }

    const record = userProgress.docs[0]

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        email: record.email,
        guestId: record.guestId,
        verified: record.verified,
        progress: record.progress,
        bookmarks: record.bookmarks,
        preferences: record.preferences,
        statistics: record.statistics,
        lastSyncAt: record.lastSyncAt,
        lastActivityAt: record.lastActivityAt,
      }
    })

  } catch (error) {
    console.error('Error fetching user progress:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

function calculateTotalReadingTime(progress: any): number {
  if (!progress?.books) return 0
  
  return Object.values(progress.books).reduce((total: number, book: any) => {
    return total + (book.timeSpent || 0)
  }, 0)
}