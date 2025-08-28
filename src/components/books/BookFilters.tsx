'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { Author, Category } from '@/payload-types'

interface BookFiltersProps {
  authors: Author[]
  categories: Category[]
  currentFilters: {
    category: string
    author: string
    featured: boolean
    status: string
  }
}

export function BookFilters({ authors, categories, currentFilters }: BookFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to first page when filtering
    params.set('page', '1')
    
    router.push(`/books?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/books')
  }

  const hasActiveFilters = currentFilters.category || currentFilters.author || currentFilters.featured

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear all filters
        </button>
      )}

      {/* Status Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
        <div className="space-y-2">
          {[
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: '', label: 'All' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={currentFilters.status === option.value}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Featured Filter */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={currentFilters.featured}
            onChange={(e) => updateFilter('featured', e.target.checked ? 'true' : '')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Featured books only</span>
        </label>
      </div>

      {/* Categories Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              value=""
              checked={!currentFilters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">All categories</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="radio"
                name="category"
                value={category.id.toString()}
                checked={currentFilters.category === category.id.toString()}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                {category.name}
                {category.booksCount && category.booksCount > 0 && (
                  <span className="text-gray-500 ml-1">({category.booksCount})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Authors Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Authors</h3>
        <div className={`space-y-2 overflow-y-auto ${isExpanded ? 'max-h-64' : 'max-h-32'}`}>
          <label className="flex items-center">
            <input
              type="radio"
              name="author"
              value=""
              checked={!currentFilters.author}
              onChange={(e) => updateFilter('author', e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">All authors</span>
          </label>
          {authors.map((author) => (
            <label key={author.id} className="flex items-center">
              <input
                type="radio"
                name="author"
                value={author.id.toString()}
                checked={currentFilters.author === author.id.toString()}
                onChange={(e) => updateFilter('author', e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                {author.name}
                {author.booksCount && author.booksCount > 0 && (
                  <span className="text-gray-500 ml-1">({author.booksCount})</span>
                )}
              </span>
            </label>
          ))}
        </div>
        
        {authors.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2"
          >
            {isExpanded ? 'Show less' : `Show all ${authors.length} authors`}
          </button>
        )}
      </div>
    </div>
  )
}