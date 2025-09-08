import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { ChapterReader } from '@/components/reading/ChapterReader'
import { ChapterNavigation } from '@/components/reading/ChapterNavigation'
import { ReadingProgressProvider } from '@/components/reading/ReadingProgressProvider'
import type { Book, Author, Chapter } from '@/payload-types'

interface ChapterPageProps {
  params: {
    slug: string
    chapterSlug: string
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapterSlug } = params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    // Fetch the book first
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
      notFound()
    }

    const book = booksResult.docs[0] as Book
    const author = book.author as Author

    // Fetch the current chapter
    const chaptersResult = await payload.find({
      collection: 'chapters',
      where: {
        and: [
          { slug: { equals: chapterSlug } },
          { book: { equals: book.id } },
          { status: { equals: 'published' } }
        ]
      },
      limit: 1,
    })

    if (!chaptersResult.docs || chaptersResult.docs.length === 0) {
      notFound()
    }

    const currentChapter = chaptersResult.docs[0] as Chapter

    // Fetch all chapters for navigation
    const allChaptersResult = await payload.find({
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

    const allChapters = allChaptersResult.docs as Chapter[]
    const currentIndex = allChapters.findIndex(ch => ch.id === currentChapter.id)
    const previousChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null

    return (
      <ReadingProgressProvider bookId={book.id} chapterId={currentChapter.id}>
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Back to Book */}
                <div className="flex items-center space-x-4">
                  <a
                    href={`/books/${book.slug}`}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Book
                  </a>
                </div>

                {/* Chapter Info */}
                <div className="flex-1 text-center">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {currentChapter.title}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Chapter {currentChapter.chapterNumber} of {allChapters.length}
                  </p>
                </div>

                {/* Reading Settings */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Chapter Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentChapter.title}
                  </h1>
                  <p className="text-lg text-gray-600">
                    Chapter {currentChapter.chapterNumber} • {book.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    by {author.name}
                  </p>
                </div>
                
                {/* Chapter Metadata */}
                <div className="text-right text-sm text-gray-500">
                  {currentChapter.wordCount && (
                    <p>{currentChapter.wordCount.toLocaleString()} words</p>
                  )}
                  {currentChapter.estimatedReadingTime && (
                    <p>{currentChapter.estimatedReadingTime} min read</p>
                  )}
                </div>
              </div>

              {/* Chapter Summary */}
              {currentChapter.summary && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <p className="text-blue-800 italic">{currentChapter.summary}</p>
                </div>
              )}
            </div>

            {/* Chapter Content */}
            <ChapterReader 
              chapter={currentChapter}
              book={book}
            />

            {/* Chapter Navigation */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <ChapterNavigation
                book={book}
                currentChapter={currentChapter}
                previousChapter={previousChapter}
                nextChapter={nextChapter}
                allChapters={allChapters}
              />
            </div>
          </div>
        </div>
      </ReadingProgressProvider>
    )
  } catch (error) {
    console.error('Error fetching chapter:', error)
    notFound()
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ChapterPageProps) {
  const { slug, chapterSlug } = params
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

    const chaptersResult = await payload.find({
      collection: 'chapters',
      where: {
        and: [
          { slug: { equals: chapterSlug } },
          { status: { equals: 'published' } }
        ]
      },
      limit: 1,
    })

    if (!booksResult.docs?.[0] || !chaptersResult.docs?.[0]) {
      return {
        title: 'Chapter Not Found - Life Force Books',
      }
    }

    const book = booksResult.docs[0] as Book
    const chapter = chaptersResult.docs[0] as Chapter
    const author = book.author as Author

    return {
      title: `${chapter.title} - ${book.title} by ${author.name} - Life Force Books`,
      description: chapter.summary || `Read Chapter ${chapter.chapterNumber} of ${book.title} by ${author.name}`,
      openGraph: {
        title: `${chapter.title} - ${book.title}`,
        description: chapter.summary || `Chapter ${chapter.chapterNumber} of ${book.title}`,
        type: 'article',
      },
    }
  } catch (error) {
    return {
      title: 'Chapter Not Found - Life Force Books',
    }
  }
}

// Generate static params for static generation
export async function generateStaticParams({ params }: { params: { slug: string } }) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const booksResult = await payload.find({
      collection: 'books',
      where: {
        and: [
          { slug: { equals: params.slug } },
          { status: { equals: 'published' } }
        ]
      },
      limit: 1,
    })

    if (!booksResult.docs?.[0]) return []

    const book = booksResult.docs[0]
    const chaptersResult = await payload.find({
      collection: 'chapters',
      where: {
        and: [
          { book: { equals: book.id } },
          { status: { equals: 'published' } }
        ]
      },
      select: {
        slug: true,
      },
    })

    return chaptersResult.docs.map((chapter) => ({
      chapterSlug: chapter.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}