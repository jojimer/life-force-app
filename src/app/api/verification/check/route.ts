import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { hasPendingVerification } from '@/lib/verification-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const type = searchParams.get('type') || 'progress-backup'

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })
    
    const hasPending = await hasPendingVerification(
      payload, 
      email, 
      type as 'email-verification' | 'password-reset' | 'progress-backup' | 'account-recovery'
    )

    return NextResponse.json({
      success: true,
      hasPending,
      email,
      type,
    })

  } catch (error) {
    console.error('Error checking pending verification:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check verification status' },
      { status: 500 }
    )
  }
}