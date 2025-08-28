'use client'

import Link from 'next/link'
import { BookCoverImage } from '@/components/OptimizedImage'
import type { Book, Author, Category, Media } from '@/payload-types'

interface BookGridProps {
  books: Book[]
}

export function BookGrid({ books }: BookGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}

interface BookCardProps {
  book: Book
}

function BookCard({ book }: BookCardProps) {
  const author = book.author as Author
  const coverImage = book.coverImage as Media
  const categories = book.categories as Category[]

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      <Link href={`/books/${book.slug}`} className="block">
        {/* Book Cover */}
        <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
          {coverImage ? (
            <BookCoverImage
              media={coverImage}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          
          {/* Featured Badge */}
          {book.featured && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⭐ Featured
              </span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              book.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {book.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Book Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {book.title}
          </h3>
          
          {author && (
            <p className="text-sm text-gray-600 mb-2">
              by {author.name}
            </p>
          )}

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.slice(0, 2).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {category.name}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  +{categories.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Book Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {book.chaptersCount && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {book.chaptersCount} chapters
                </span>
              )}
              
              {book.pageCount && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {book.pageCount} pages
                </span>
              )}
            </div>

            {book.downloadCount && book.downloadCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {book.downloadCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}