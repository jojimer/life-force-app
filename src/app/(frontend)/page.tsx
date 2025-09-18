import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Book } from '@/payload-types'
import { ProgressRecoveryButton } from '@/components/user/ProgressRecoveryButton'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Fetch featured books for homepage
  const featuredBooks = await payload.find({
    collection: 'books',
    where: {
      and: [
        { status: { equals: 'published' } },
        { featured: { equals: true } }
      ]
    },
    limit: 6,
    depth: 2,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Life Force Books
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover, read, and enjoy our collection of digital books. Start your reading journey today.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/books"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Browse Books
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      {featuredBooks.docs && featuredBooks.docs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Books</h2>
            <p className="mt-4 text-lg text-gray-600">
              Discover our handpicked selection of featured books
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(featuredBooks.docs as Book[]).map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <Link href={`/books/${book.slug}`} className="block p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    by {typeof book.author === 'object' ? book.author.name : 'Unknown Author'}
                  </p>
                  <div className="text-blue-600 text-sm font-medium">
                    Read now →
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/books"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              View All Books
            </Link>
          </div>
        </div>
      )}

      {/* Progress Recovery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Have reading progress saved to an email? 
          </p>
          <ProgressRecoveryButton variant="link" />
        </div>
      </div>

      {/* Admin Link for authenticated users */}
      {user && (
        <div className="fixed bottom-4 right-4">
          <a
            href={payloadConfig.routes.admin}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 shadow-lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Admin Panel
          </a>
        </div>
      )}
      </div>
    </div>
  )
}
