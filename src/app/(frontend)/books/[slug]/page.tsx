import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { OptimizedImage, BookCoverImage } from '@/components/OptimizedImage'
import { ReadSampleButton } from '@/components/books/ReadSampleButton'
import { TableOfContents } from '@/components/books/TableOfContents'
import { BookMetadata } from '@/components/books/BookMetadata'
import { RelatedBooks } from '@/components/books/RelatedBooks'
import type { Book, Author, Category, Chapter } from '@/payload-types'

interface BookDetailPageProps {
  params: {
    slug: string
  }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    // Fetch the book with all relationships
    const booksResult = await payload.find({
      collection: 'books',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } }
        ]
      },
      depth: 3, // Include author, categories, and cover image
      limit: 1,
    })

    if (!booksResult.docs || booksResult.docs.length === 0) {
      notFound()
    }

    const book = booksResult.docs[0] as Book
    const author = book.author as Author
    const categories = (book.categories as Category[]) || []
    const coverImage = book.coverImage as any

    // Fetch chapters for table of contents
    const chaptersResult = await payload.find({
      collection: 'chapters',
      where: {
        and: [
          { book: { equals: book.id } },
          { status: { equals: 'published' } }
        ]
      },
      sort: 'chapterNumber',
      limit: 100,
    })

    const chapters = chaptersResult.docs as Chapter[]
    const firstChapter = chapters[0]

    // Fetch related books (same author or categories)
    const relatedBooksResult = await payload.find({
      collection: 'books',
      where: {
        and: [
          { status: { equals: 'published' } },
          { id: { not_equals: book.id } },
          {
            or: [
              { author: { equals: author.id } },
              ...(categories.length > 0 ? [{ categories: { in: categories.map(cat => cat.id) } }] : [])
            ]
          }
        ]
      },
      limit: 4,
      depth: 2,
    })

    const relatedBooks = relatedBooksResult.docs as Book[]

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <a href="/" className="text-gray-500 hover:text-gray-700">
                    Home
                  </a>
                </li>
                <li>
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <a href="/books" className="text-gray-500 hover:text-gray-700">
                    Books
                  </a>
                </li>
                <li>
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <span className="text-gray-900 font-medium">{book.title}</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Book Cover and Actions */}
            <div className="lg:col-span-4">
              <div className="sticky top-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {/* Book Cover */}
                  <div className="aspect-[3/4] mb-6">
                    {coverImage ? (
                      <BookCoverImage
                        media={coverImage}
                        className="w-full h-full object-cover rounded-lg shadow-md"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No cover image</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {firstChapter && (
                      <ReadSampleButton
                        bookSlug={book.slug}
                        chapterSlug={firstChapter.slug}
                        chapterTitle={firstChapter.title}
                      />
                    )}
                    
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      Start Reading
                    </button>
                    
                    <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      Add to Library
                    </button>
                  </div>

                  {/* Book Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Chapters</span>
                        <p className="font-medium">{chapters.length}</p>
                      </div>
                      {book.pageCount && (
                        <div>
                          <span className="text-gray-500">Pages</span>
                          <p className="font-medium">{book.pageCount}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Language</span>
                        <p className="font-medium capitalize">{book.language}</p>
                      </div>
                      {book.downloadCount && (
                        <div>
                          <span className="text-gray-500">Downloads</span>
                          <p className="font-medium">{book.downloadCount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="mt-8 lg:mt-0 lg:col-span-8">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Book Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {book.title}
                      </h1>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <a
                          href={`/authors/${author.slug}`}
                          className="text-lg text-blue-600 hover:text-blue-800 font-medium"
                        >
                          by {author.name}
                        </a>
                        
                        {book.publicationDate && (
                          <span className="text-gray-500">
                            Published {new Date(book.publicationDate).getFullYear()}
                          </span>
                        )}
                      </div>

                      {/* Categories */}
                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {categories.map((category) => (
                            <a
                              key={category.id}
                              href={`/books?category=${category.id}`}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            >
                              {category.name}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Featured Badge */}
                      {book.featured && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mb-4">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Featured
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Book Description */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Book</h2>
                  <div className="prose prose-gray max-w-none">
                    {book.description && (
                      <div dangerouslySetInnerHTML={{ 
                        __html: typeof book.description === 'string' 
                          ? book.description 
                          : JSON.stringify(book.description) 
                      }} />
                    )}
                  </div>
                </div>

                {/* Table of Contents */}
                {chapters.length > 0 && (
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
                    <TableOfContents chapters={chapters} bookSlug={book.slug} />
                  </div>
                )}

                {/* Book Metadata */}
                <div className="p-6">
                  <BookMetadata book={book} author={author} />
                </div>
              </div>

              {/* Related Books */}
              {relatedBooks.length > 0 && (
                <div className="mt-8">
                  <RelatedBooks books={relatedBooks} title="More by this author" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching book:', error)
    notFound()
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BookDetailPageProps) {
  const { slug } = params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const booksResult = await payload.find({
      collection: 'books',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } }
        ]
      },
      depth: 2,
      limit: 1,
    })

    if (!booksResult.docs || booksResult.docs.length === 0) {
      return {
        title: 'Book Not Found - Life Force Books',
      }
    }

    const book = booksResult.docs[0] as Book
    const author = book.author as Author
    const coverImage = book.coverImage as any

    return {
      title: `${book.title} by ${author.name} - Life Force Books`,
      description: typeof book.description === 'string' 
        ? book.description.substring(0, 160) 
        : `Read ${book.title} by ${author.name} on Life Force Books`,
      openGraph: {
        title: book.title,
        description: typeof book.description === 'string' 
          ? book.description.substring(0, 160) 
          : `Read ${book.title} by ${author.name}`,
        images: coverImage?.url ? [coverImage.url] : [],
        type: 'book',
      },
      twitter: {
        card: 'summary_large_image',
        title: book.title,
        description: typeof book.description === 'string' 
          ? book.description.substring(0, 160) 
          : `Read ${book.title} by ${author.name}`,
        images: coverImage?.url ? [coverImage.url] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Book Not Found - Life Force Books',
    }
  }
}

// Generate static params for static generation
export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const books = await payload.find({
      collection: 'books',
      where: {
        status: { equals: 'published' }
      },
      limit: 1000,
      select: {
        slug: true,
      },
    })

    return books.docs.map((book) => ({
      slug: book.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}