'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Media } from '../payload-types'
import { 
  generateSrcSet, 
  generateSizes, 
  getOptimizedImageUrl, 
  getImageDimensions,
  generateBlurDataUrl 
} from '../lib/media-utils'

interface OptimizedImageProps {
  media: Media
  size?: 'thumbnail' | 'card' | 'cover' | 'hero' | 'mobile'
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  alt?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  media,
  size = 'cover',
  className = '',
  priority = false,
  fill = false,
  sizes,
  alt,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const imageUrl = getOptimizedImageUrl(media, size)
  const dimensions = getImageDimensions(media, size)
  const altText = alt || media.alt || 'Image'

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? {} : { width: dimensions.width, height: dimensions.height }}
      >
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={fill ? {} : { width: dimensions.width, height: dimensions.height }}
      />
    )
  }

  const imageProps = {
    src: imageUrl,
    alt: altText,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    ...(fill ? { fill: true } : { width: dimensions.width, height: dimensions.height }),
    ...(sizes && { sizes }),
    placeholder: 'blur' as const,
    blurDataURL: generateBlurDataUrl(20, 20),
  }

  return (
    <div className="relative">
      <Image {...imageProps} />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={fill ? {} : { width: dimensions.width, height: dimensions.height }}
        />
      )}
    </div>
  )
}

// Specialized components for common use cases
export function BookCoverImage({ 
  media, 
  className = "rounded-lg shadow-md",
  ...props 
}: Omit<OptimizedImageProps, 'size'>) {
  return (
    <OptimizedImage 
      media={media} 
      size="cover" 
      className={className}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      {...props} 
    />
  )
}

export function AuthorPhotoImage({ 
  media, 
  className = "rounded-full",
  ...props 
}: Omit<OptimizedImageProps, 'size'>) {
  return (
    <OptimizedImage 
      media={media} 
      size="thumbnail" 
      className={className}
      sizes="(max-width: 640px) 20vw, 10vw"
      {...props} 
    />
  )
}

export function HeroImage({ 
  media, 
  className = "w-full h-full object-cover",
  ...props 
}: Omit<OptimizedImageProps, 'size'>) {
  return (
    <OptimizedImage 
      media={media} 
      size="hero" 
      className={className}
      fill
      sizes="100vw"
      priority
      {...props} 
    />
  )
}