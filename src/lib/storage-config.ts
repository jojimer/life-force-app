/**
 * Storage configuration utilities for media management
 */

export const STORAGE_CONFIG = {
  // File size limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB for images
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB for documents/ebooks

  // Image optimization settings
  IMAGE_QUALITY: {
    thumbnail: 80,
    card: 85,
    cover: 90,
    hero: 85,
    mobile: 80,
    original: 95,
  },

  // Supported file types
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ],

  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    'text/plain',
  ],

  // Image sizes for different use cases
  IMAGE_SIZES: {
    thumbnail: { width: 150, height: 200 },
    card: { width: 300, height: 400 },
    cover: { width: 600, height: 800 },
    hero: { width: 1200, height: 800 },
    mobile: { width: 400, height: 533 },
  },
} as const

/**
 * Check if S3 storage is configured
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  )
}

/**
 * Get storage type being used
 */
export function getStorageType(): 'local' | 's3' {
  return isS3Configured() ? 's3' : 'local'
}

/**
 * Get media URL based on storage type
 */
export function getMediaUrl(filename: string): string {
  if (isS3Configured()) {
    const bucket = process.env.S3_BUCKET
    const region = process.env.S3_REGION || 'us-east-1'
    const endpoint = process.env.S3_ENDPOINT
    
    if (endpoint) {
      return `${endpoint}/${bucket}/media/${filename}`
    }
    
    return `https://${bucket}.s3.${region}.amazonaws.com/media/${filename}`
  }
  
  // Local storage
  return `/media/${filename}`
}

/**
 * Validate file type and size
 */
export function validateFile(file: { mimeType?: string; size?: number }): {
  isValid: boolean
  error?: string
} {
  const { mimeType, size } = file

  if (!mimeType) {
    return { isValid: false, error: 'File type is required' }
  }

  const isImage = STORAGE_CONFIG.SUPPORTED_IMAGE_TYPES.includes(mimeType)
  const isDocument = STORAGE_CONFIG.SUPPORTED_DOCUMENT_TYPES.includes(mimeType)

  if (!isImage && !isDocument) {
    return { 
      isValid: false, 
      error: `Unsupported file type: ${mimeType}` 
    }
  }

  if (size) {
    const maxSize = isImage 
      ? STORAGE_CONFIG.MAX_IMAGE_SIZE 
      : STORAGE_CONFIG.MAX_DOCUMENT_SIZE

    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return { 
        isValid: false, 
        error: `File size exceeds ${maxSizeMB}MB limit` 
      }
    }
  }

  return { isValid: true }
}