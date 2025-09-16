'use client'

import { useState } from 'react'
import { useEmailVerification } from '@/hooks/useEmailVerification'
import { useGuestSession } from '@/hooks/useGuestSession'
import { useUserProgress } from '@/hooks/useUserProgress'

interface EmailConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (email: string) => void
}

export function EmailConnectionModal({ isOpen, onClose, onSuccess }: EmailConnectionModalProps) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'input' | 'verification' | 'success'>('input')
  const [verificationCode, setVerificationCode] = useState('')
  
  const { guestId } = useGuestSession()
  const { progress, bookmarks, preferences } = useUserProgress({
    guestId: guestId || '',
    autoSync: false
  })
  
  const { 
    sendVerificationEmail, 
    verifyTokenWithProgress,
    isLoading, 
    error, 
    clearError,
    pendingEmail 
  } = useEmailVerification({
    onVerificationSent: (email) => {
      setStep('verification')
    },
    onVerificationSuccess: (email) => {
      setStep('success')
      onSuccess?.(email)
    }
  })

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!email.trim()) return
    
    try {
      await sendVerificationEmail(email, guestId || undefined, 'progress-backup')
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!verificationCode.trim()) return
    
    try {
      // Prepare guest progress data for sync
      const guestProgress = {
        books: progress.books,
        currentlyReading: progress.currentlyReading,
        completed: progress.completed,
        lastActivity: progress.lastActivity,
        bookmarks,
        preferences,
      }
      
      await verifyTokenWithProgress(verificationCode, guestProgress, 'progress-backup')
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleClose = () => {
    setStep('input')
    setEmail('')
    setVerificationCode('')
    clearError()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'input' && 'Save Your Progress'}
            {step === 'verification' && 'Check Your Email'}
            {step === 'success' && 'Progress Connected!'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Email Input */}
        {step === 'input' && (
          <div>
            <p className="text-gray-600 mb-6">
              Enter your email to save your reading progress and access it from any device.
            </p>
            
            <form onSubmit={handleSendVerification} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send Verification'}
                </button>
              </div>
            </form>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Privacy:</strong> We only use your email to save your reading progress. 
                No spam, no marketing emails.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Verification Code */}
        {step === 'verification' && (
          <div>
            <p className="text-gray-600 mb-4">
              We've sent a verification code to <strong>{pendingEmail || email}</strong>. 
              Enter the code below to connect your progress.
            </p>
            
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                  required
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => sendVerificationEmail(email, guestId || undefined, 'progress-backup')}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                disabled={isLoading}
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Progress Connected!
            </h3>
            
            <p className="text-gray-600 mb-6">
              Your reading progress is now saved to your email. You can access it from any device 
              by entering the same email address.
            </p>
            
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Continue Reading
            </button>
          </div>
        )}
      </div>
    </div>
  )
}