import type { Media } from '../payload-types'

/**
 * Generate responsive image srcset for different screen sizes
 */
export function generateSrcSet(media: Media): string {
  if (!media.url) return ''
  
  const sizes = ['thumbnail', 'card', 'cover', 'hero', 'mobile']
  const srcSet: string[] = []
  
  // Add original image
  srcSet.push(`${media.url} ${media.width || 1200}w`)
  
  // Add generated sizes
  sizes.forEach(size => {
    const sizeUrl = media.sizes?.[size]?.url
    const sizeWidth = media.sizes?.[size]?.width
    if (sizeUrl && sizeWidth) {
      srcSet.push(`${sizeUrl} ${sizeWidth}w`)
    }
  })
  
  return srcSet.join(', ')
}

/**
 * Get optimized image URL for specific use case
 */
export function getOptimizedImageUrl(
  media: Media, 
  size: 'thumbnail' | 'card' | 'cover' | 'hero' | 'mobile' = 'cover'
): string {
  return media.sizes?.[size]?.url || media.url || ''
}

/**
 * Generate image sizes attribute for responsive images
 */
export function generateSizes(): string {
  return [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 50vw', 
    '(max-width: 1024px) 33vw',
    '25vw'
  ].join(', ')
}

/**
 * Get image dimensions for a specific size
 */
export function getImageDimensions(
  media: Media, 
  size: 'thumbnail' | 'card' | 'cover' | 'hero' | 'mobile' = 'cover'
): { width: number; height: number } {
  const sizeData = media.sizes?.[size]
  return {
    width: sizeData?.width || media.width || 600,
    height: sizeData?.height || media.height || 800,
  }
}

/**
 * Check if media is an image
 */
export function isImage(media: Media): boolean {
  return media.mimeType?.startsWith('image/') || false
}

/**
 * Check if media is a document
 */
export function isDocument(media: Media): boolean {
  const documentTypes = ['application/pdf', 'application/epub+zip']
  return documentTypes.includes(media.mimeType || '')
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate blur placeholder for images
 */
export function generateBlurDataUrl(width: number = 10, height: number = 10): string {
  const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) return ''
  
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL()
}