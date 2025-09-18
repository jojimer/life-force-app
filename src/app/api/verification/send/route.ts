import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createVerificationToken } from '@/lib/verification-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, guestId, type = 'progress-backup', metadata } = body

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
    
    // Get client IP and user agent for security
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create verification token
    const tokenData = await createVerificationToken(payload, {
      email,
      type,
      guestId,
      metadata,
      ipAddress,
      userAgent,
    })

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Update token with the code
    await payload.update({
      collection: 'verification-tokens',
      id: tokenData.id,
      data: {
        token: verificationCode,
      },
    })

    // Send verification email
    await sendVerificationEmail(email, verificationCode, type)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      tokenId: tokenData.id,
    })

  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}

async function sendVerificationEmail(email: string, code: string, type: string) {
  // Check if we have email service configured
  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    console.log(`Verification code for ${email}: ${code}`)
    return
  }

  const subject = getEmailSubject(type)
  const htmlContent = getEmailTemplate(code, type)

  try {
    if (process.env.RESEND_API_KEY) {
      // Use Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@lifeforce.com',
          to: [email],
          subject,
          html: htmlContent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.statusText}`)
      }
    } else if (process.env.SMTP_HOST) {
      // Use SMTP (implement if needed)
      console.log('SMTP sending not implemented yet')
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    // Don't throw - we still want to return success to user
    // They can try again if they don't receive the email
  }
}

function getEmailSubject(type: string): string {
  switch (type) {
    case 'progress-backup':
      return 'Your Life Force Books Verification Code'
    case 'email-verification':
      return 'Verify Your Email - Life Force Books'
    case 'account-recovery':
      return 'Recover Your Progress - Life Force Books'
    default:
      return 'Verification Code - Life Force Books'
  }
}

function getEmailTemplate(code: string, type: string): string {
  const title = type === 'progress-backup' 
    ? 'Save Your Reading Progress' 
    : type === 'account-recovery'
    ? 'Recover Your Reading Progress'
    : 'Verify Your Email'
    
  const description = type === 'progress-backup'
    ? 'Use this code to connect your email and save your reading progress:'
    : type === 'account-recovery'
    ? 'Use this code to recover your saved reading progress:'
    : 'Use this code to verify your email address:'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #2563eb; color: white; padding: 32px 24px; text-align: center; }
        .content { padding: 32px 24px; }
        .code-box { background-color: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937; font-family: monospace; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Life Force Books</h1>
          <p>${title}</p>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          <p>${description}</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p>This code will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't request this code, you can safely ignore this email.</p>
          
          <p>Happy reading!<br>The Life Force Books Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent to verify your identity. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}