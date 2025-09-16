'use client'

import { useState, useEffect } from 'react'
import { EmailConnectionModal } from './EmailConnectionModal'
import { useGuestSession } from '@/hooks/useGuestSession'

interface ProgressSavePromptProps {
  className?: string
}

export function ProgressSavePrompt({ className = '' }: ProgressSavePromptProps) {
  const [showModal, setShowModal] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { guestId } = useGuestSession()

  // Check if user has already connected their email
  useEffect(() => {
    const connectedEmail = localStorage.getItem('connectedEmail')
    const dismissed = localStorage.getItem('progressPromptDismissed')
    
    setIsConnected(!!connectedEmail)
    setIsDismissed(!!dismissed)
  }, [])

  const handleSuccess = (email: string) => {
    localStorage.setItem('connectedEmail', email)
    setIsConnected(true)
    setShowModal(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('progressPromptDismissed', 'true')
    setIsDismissed(true)
  }

  // Don't show if already connected, dismissed, or no guest session
  if (isConnected || isDismissed || !guestId) {
    return null
  }

  return (
    <>
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Save Your Reading Progress
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Connect your email to save your progress and access it from any device.
            </p>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
              >
                Connect Email
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-blue-400 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <EmailConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}