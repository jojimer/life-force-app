import { getPayload } from 'payload'
import config from '@/payload.config'
import { BookGrid } from '@/components/books/BookGrid'
import { BookFilters } from '@/components/books/BookFilters'
import { BookSearch } from '@/components/books/BookSearch'
import { Pagination } from '@/components/ui/Pagination'
import type { Book, Author, Category } from '@/payload-types'

interface BooksPageProps {
  searchParams: {
    search?: string
    category?: string
    author?: string
    status?: string
    featured?: string
    page?: string
    limit?: string
    sort?: string
  }
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const payload = await getPayload({ config })
  
  // Parse search parameters
  const {
    search = '',
    category = '',
    author = '',
    status = 'published',
    featured = '',
    page = '1',
    limit = '12',
    sort = '-createdAt'
  } = searchParams

  const currentPage = parseInt(page)
  const itemsPerPage = parseInt(limit)

  // Build query conditions
  const where: any = {
    and: [
      { status: { equals: status } }
    ]
  }

  // Add search condition
  if (search) {
    where.and.push({
      or: [
        { title: { contains: search } },
        { description: { contains: search } },
        { 'author.name': { contains: search } }
      ]
    })
  }

  // Add category filter
  if (category) {
    where.and.push({
      categories: { in: [category] }
    })
  }

  // Add author filter
  if (author) {
    where.and.push({
      author: { equals: author }
    })
  }

  // Add featured filter
  if (featured === 'true') {
    where.and.push({
      featured: { equals: true }
    })
  }

  try {
    // Fetch books with relationships
    const booksResult = await payload.find({
      collection: 'books',
      where,
      sort,
      limit: itemsPerPage,
      page: currentPage,
      depth: 2, // Include author and category relationships
    })

    // Fetch all authors and categories for filters
    const [authorsResult, categoriesResult] = await Promise.all([
      payload.find({
        collection: 'authors',
        limit: 100,
        sort: 'name',
      }),
      payload.find({
        collection: 'categories',
        limit: 100,
        sort: 'name',
      })
    ])

    const books = booksResult.docs as Book[]
    const authors = authorsResult.docs as Author[]
    const categories = categoriesResult.docs as Category[]

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Discover Books
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our collection of books across various genres and topics
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Filters
                </h2>
                <BookFilters
                  authors={authors}
                  categories={categories}
                  currentFilters={{
                    category,
                    author,
                    featured: featured === 'true',
                    status
                  }}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search and Sort */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <BookSearch initialValue={search} />
                  
                  <div className="flex items-center gap-4">
                    <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                      Sort by:
                    </label>
                    <select
                      id="sort"
                      name="sort"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={sort}
                      onChange={(e) => {
                        const url = new URL(window.location.href)
                        url.searchParams.set('sort', e.target.value)
                        url.searchParams.set('page', '1')
                        window.location.href = url.toString()
                      }}
                    >
                      <option value="-createdAt">Newest First</option>
                      <option value="createdAt">Oldest First</option>
                      <option value="title">Title A-Z</option>
                      <option value="-title">Title Z-A</option>
                      <option value="-featured">Featured First</option>
                      <option value="-downloadCount">Most Popular</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {books.length} of {booksResult.totalDocs} books
                  {search && (
                    <span className="ml-1">
                      for "<span className="font-medium">{search}</span>"
                    </span>
                  )}
                </p>
              </div>

              {/* Books Grid */}
              {books.length > 0 ? (
                <>
                  <BookGrid books={books} />
                  
                  {/* Pagination */}
                  {booksResult.totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={booksResult.totalPages}
                        totalItems={booksResult.totalDocs}
                        itemsPerPage={itemsPerPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No books found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={() => window.location.href = '/books'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching books:', error)
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">
            We couldn't load the books. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}

export const metadata = {
  title: 'Books - Life Force Books',
  description: 'Discover our collection of books across various genres and topics',
}