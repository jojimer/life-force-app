import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { mergeProgressData, validateProgressData } from '@/lib/progress-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, currentGuestId, progressData } = body

    if (!email || !currentGuestId || !progressData) {
      return NextResponse.json(
        { success: false, message: 'Email, guest ID, and progress data are required' },
        { status: 400 }
      )
    }

    // Validate progress data structure
    if (progressData.progress && !validateProgressData(progressData.progress)) {
      return NextResponse.json(
        { success: false, message: 'Invalid progress data format' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })

    // Check if current guest already has progress
    const existingGuestProgress = await payload.find({
      collection: 'user-progress',
      where: {
        guestId: { equals: currentGuestId }
      },
      limit: 1,
    })

    const now = new Date().toISOString()
    let mergedProgress = progressData.progress
    let mergedBookmarks = progressData.bookmarks
    let mergedPreferences = progressData.preferences

    // If guest has existing progress, merge it
    if (existingGuestProgress.docs && existingGuestProgress.docs.length > 0) {
      const guestRecord = existingGuestProgress.docs[0]
      
      // Merge progress data
      if (guestRecord.progress && progressData.progress) {
        mergedProgress = mergeProgressData(guestRecord.progress, progressData.progress)
      }
      
      // Merge bookmarks (keep both sets)
      if (guestRecord.bookmarks && progressData.bookmarks) {
        mergedBookmarks = {
          bookmarks: [
            ...(guestRecord.bookmarks.bookmarks || []),
            ...(progressData.bookmarks.bookmarks || [])
          ],
          notes: [
            ...(guestRecord.bookmarks.notes || []),
            ...(progressData.bookmarks.notes || [])
          ],
          highlights: [
            ...(guestRecord.bookmarks.highlights || []),
            ...(progressData.bookmarks.highlights || [])
          ],
        }
      }
      
      // Use most recent preferences
      if (guestRecord.preferences) {
        mergedPreferences = {
          ...progressData.preferences,
          ...guestRecord.preferences, // Guest preferences take precedence
        }
      }

      // Delete the old guest record
      await payload.delete({
        collection: 'user-progress',
        id: guestRecord.id,
      })
    }

    // Create or update progress record with merged data
    const syncRecord = {
      syncedAt: now,
      syncType: 'recovery' as const,
      deviceId: currentGuestId,
      dataSize: JSON.stringify({ mergedProgress, mergedBookmarks, mergedPreferences }).length,
    }

    // Check if email already has a verified record
    const existingEmailProgress = await payload.find({
      collection: 'user-progress',
      where: {
        email: { equals: email }
      },
      limit: 1,
    })

    let finalRecord
    if (existingEmailProgress.docs && existingEmailProgress.docs.length > 0) {
      // Update existing email record with merged data
      const emailRecord = existingEmailProgress.docs[0]
      
      finalRecord = await payload.update({
        collection: 'user-progress',
        id: emailRecord.id,
        data: {
          guestId: currentGuestId, // Link to current device
          progress: mergedProgress,
          bookmarks: mergedBookmarks,
          preferences: mergedPreferences,
          lastSyncAt: now,
          lastActivityAt: now,
          isActive: true,
          syncHistory: [
            ...(emailRecord.syncHistory || []).slice(-9), // Keep last 10 entries
            syncRecord
          ],
          statistics: {
            ...emailRecord.statistics,
            totalBooksRead: mergedProgress?.completed?.length || 0,
            totalReadingTime: calculateTotalReadingTime(mergedProgress),
          }
        },
      })
    } else {
      // Create new record (shouldn't happen in recovery flow, but handle it)
      finalRecord = await payload.create({
        collection: 'user-progress',
        data: {
          email,
          guestId: currentGuestId,
          verified: true, // Already verified through recovery process
          progress: mergedProgress,
          bookmarks: mergedBookmarks,
          preferences: mergedPreferences,
          lastSyncAt: now,
          lastActivityAt: now,
          isActive: true,
          syncHistory: [syncRecord],
          statistics: {
            totalBooksRead: mergedProgress?.completed?.length || 0,
            totalReadingTime: calculateTotalReadingTime(mergedProgress),
            averageReadingSpeed: 200,
            longestStreak: 0,
            currentStreak: 0,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Progress data restored successfully',
      data: {
        id: finalRecord.id,
        email: finalRecord.email,
        lastSyncAt: finalRecord.lastSyncAt,
      },
      stats: {
        booksCount: Object.keys(mergedProgress?.books || {}).length,
        bookmarksCount: (mergedBookmarks?.bookmarks || []).length,
        action: 'restored'
      }
    })

  } catch (error) {
    console.error('Error restoring user progress:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to restore progress data' },
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