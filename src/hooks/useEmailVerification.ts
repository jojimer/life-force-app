/**
 * Hook for managing email verification process
 */
'use client'

import { useState, useCallback } from 'react'

interface UseEmailVerificationOptions {
  onVerificationSent?: (email: string) => void
  onVerificationSuccess?: (email: string) => void
  onVerificationError?: (error: string) => void
}

export function useEmailVerification(options: UseEmailVerificationOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Send verification email
  const sendVerificationEmail = useCallback(async (
    email: string,
    guestId?: string,
    type: 'email-verification' | 'progress-backup' = 'email-verification'
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          guestId,
          type,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send verification email')
      }

      setPendingEmail(email)
      options.onVerificationSent?.(email)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email'
      setError(errorMessage)
      options.onVerificationError?.(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  // Verify token
  const verifyToken = useCallback(async (
    token: string,
    type: 'email-verification' | 'progress-backup' = 'email-verification'
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          type,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Token verification failed')
      }

      if (result.tokenData?.email) {
        options.onVerificationSuccess?.(result.tokenData.email)
        setPendingEmail(null)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token verification failed'
      setError(errorMessage)
      options.onVerificationError?.(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  // Check if email has pending verification
  const checkPendingVerification = useCallback(async (
    email: string,
    type: 'email-verification' | 'progress-backup' = 'email-verification'
  ) => {
    try {
      const response = await fetch(`/api/verification/check?email=${encodeURIComponent(email)}&type=${type}`)
      const result = await response.json()
      
      return result.hasPending || false
    } catch (err) {
      console.error('Error checking pending verification:', err)
      return false
    }
  }, [])

  // Resend verification email
  const resendVerification = useCallback(async (email?: string) => {
    const targetEmail = email || pendingEmail
    if (!targetEmail) {
      throw new Error('No email address provided')
    }

    return sendVerificationEmail(targetEmail)
  }, [pendingEmail, sendVerificationEmail])

  return {
    // State
    isLoading,
    error,
    pendingEmail,

    // Actions
    sendVerificationEmail,
    verifyToken,
    checkPendingVerification,
    resendVerification,

    // Utilities
    clearError: () => setError(null),
    clearPendingEmail: () => setPendingEmail(null),
  }
}