import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })

    // Find user progress by email
    const userProgress = await payload.find({
      collection: 'user-progress',
      where: {
        and: [
          { email: { equals: email } },
          { verified: { equals: true } } // Only recover verified accounts
        ]
      },
      limit: 1,
    })

    if (!userProgress.docs || userProgress.docs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No verified progress found for this email address',
      }, { status: 404 })
    }

    const record = userProgress.docs[0]

    // Return progress data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      message: 'Progress data found',
      data: {
        id: record.id,
        email: record.email,
        progress: record.progress,
        bookmarks: record.bookmarks,
        preferences: record.preferences,
        statistics: record.statistics,
        lastSyncAt: record.lastSyncAt,
        totalBooksRead: record.statistics?.totalBooksRead || 0,
        totalReadingTime: record.statistics?.totalReadingTime || 0,
      }
    })

  } catch (error) {
    console.error('Error recovering user progress:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to recover progress data' },
      { status: 500 }
    )
  }
}