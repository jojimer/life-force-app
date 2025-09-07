import type { Book, Author } from '@/payload-types'

interface BookMetadataProps {
  book: Book
  author: Author
}

export function BookMetadata({ book, author }: BookMetadataProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const metadata = [
    {
      label: 'Author',
      value: author.name,
      link: `/authors/${author.slug}`,
    },
    {
      label: 'Publication Date',
      value: book.publicationDate ? formatDate(book.publicationDate) : null,
    },
    {
      label: 'Language',
      value: book.language ? book.language.toUpperCase() : null,
    },
    {
      label: 'ISBN',
      value: book.isbn,
    },
    {
      label: 'Pages',
      value: book.pageCount ? book.pageCount.toLocaleString() : null,
    },
    {
      label: 'Chapters',
      value: book.chaptersCount ? book.chaptersCount.toString() : null,
    },
    {
      label: 'Downloads',
      value: book.downloadCount ? book.downloadCount.toLocaleString() : null,
    },
    {
      label: 'Last Updated',
      value: formatDate(book.updatedAt),
    },
  ].filter(item => item.value) // Only show items with values

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Details</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metadata.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-2">
            <dt className="text-sm font-medium text-gray-500 mb-1">
              {item.label}
            </dt>
            <dd className="text-sm text-gray-900">
              {item.link ? (
                <a
                  href={item.link}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* Tags */}
      {book.tags && book.tags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {book.tags.map((tagItem, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tagItem.tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}