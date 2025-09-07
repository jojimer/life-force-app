import Link from 'next/link'
import { BookCoverImage } from '@/components/OptimizedImage'
import type { Book, Author } from '@/payload-types'

interface RelatedBooksProps {
  books: Book[]
  title?: string
}

export function RelatedBooks({ books, title = "Related Books" }: RelatedBooksProps) {
  if (books.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.map((book) => {
          const author = book.author as Author
          const coverImage = book.coverImage as any

          return (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              className="group block"
            >
              <div className="aspect-[3/4] mb-3 overflow-hidden rounded-lg bg-gray-200">
                {coverImage ? (
                  <BookCoverImage
                    media={coverImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No cover
                  </div>
                )}
              </div>
              
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                {book.title}
              </h3>
              
              <p className="text-xs text-gray-600 mb-2">
                by {author.name}
              </p>

              {book.featured && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}