'use client'

import { useState } from 'react'
import { ProgressRecoveryModal } from './ProgressRecoveryModal'

interface ProgressRecoveryButtonProps {
  className?: string
  variant?: 'button' | 'link'
}

export function ProgressRecoveryButton({ 
  className = '', 
  variant = 'button' 
}: ProgressRecoveryButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = (email: string) => {
    console.log('Progress recovered for:', email)
    // Could show a toast notification here
  }

  if (variant === 'link') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`text-blue-600 hover:text-blue-800 transition-colors ${className}`}
        >
          Recover saved progress
        </button>
        
        <ProgressRecoveryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Recover Progress
      </button>
      
      <ProgressRecoveryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}