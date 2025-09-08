export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="text-center">
              <div className="h-5 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-8 bg-gray-200 rounded w-96 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-64 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="prose prose-lg max-w-none mx-auto space-y-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Navigation Skeleton */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="h-12 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Floating Buttons Skeleton */}
      <div className="fixed right-4 bottom-4 flex flex-col space-y-2">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}