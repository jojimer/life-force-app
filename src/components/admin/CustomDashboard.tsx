'use client'

import React, { useEffect, useState } from 'react'

interface DashboardStats {
  totalBooks: number
  publishedBooks: number
  draftBooks: number
  totalChapters: number
  totalAuthors: number
  totalCategories: number
  recentActivity: Array<{
    id: string
    type: string
    title: string
    updatedAt: string
  }>
}

export default function CustomDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch books
        const booksResponse = await fetch('/api/books?limit=1000')
        const booksData = await booksResponse.json()
        
        // Fetch chapters
        const chaptersResponse = await fetch('/api/chapters?limit=1000')
        const chaptersData = await chaptersResponse.json()
        
        // Fetch authors
        const authorsResponse = await fetch('/api/authors?limit=1000')
        const authorsData = await authorsResponse.json()
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories?limit=1000')
        const categoriesData = await categoriesResponse.json()

        const books = booksData.docs || []
        const publishedBooks = books.filter((book: any) => book.status === 'published')
        const draftBooks = books.filter((book: any) => book.status === 'draft')

        // Get recent activity (last 10 updated items)
        const recentBooks = books
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map((book: any) => ({
            id: book.id,
            type: 'book',
            title: book.title,
            updatedAt: book.updatedAt,
          }))

        const recentChapters = (chaptersData.docs || [])
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map((chapter: any) => ({
            id: chapter.id,
            type: 'chapter',
            title: chapter.title,
            updatedAt: chapter.updatedAt,
          }))

        const recentActivity = [...recentBooks, ...recentChapters]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10)

        setStats({
          totalBooks: books.length,
          publishedBooks: publishedBooks.length,
          draftBooks: draftBooks.length,
          totalChapters: chaptersData.totalDocs || 0,
          totalAuthors: authorsData.totalDocs || 0,
          totalCategories: categoriesData.totalDocs || 0,
          recentActivity,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="dashboard-card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="dashboard-error">
        <p>Unable to load dashboard statistics.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="custom-dashboard">
      <div className="dashboard-header">
        <h1>Life Force Books Dashboard</h1>
        <p>Manage your book publishing platform</p>
      </div>

      <div className="dashboard-grid">
        {/* Books Overview */}
        <div className="dashboard-card">
          <h3>📚 Books Overview</h3>
          <div className="dashboard-stat">
            <span className="stat-label">Total Books</span>
            <span className="stat-value">{stats.totalBooks}</span>
          </div>
          <div className="dashboard-stat">
            <span className="stat-label">Published</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {stats.publishedBooks}
            </span>
          </div>
          <div className="dashboard-stat">
            <span className="stat-label">Drafts</span>
            <span className="stat-value" style={{ color: '#d97706' }}>
              {stats.draftBooks}
            </span>
          </div>
        </div>

        {/* Content Stats */}
        <div className="dashboard-card">
          <h3>📝 Content Statistics</h3>
          <div className="dashboard-stat">
            <span className="stat-label">Total Chapters</span>
            <span className="stat-value">{stats.totalChapters}</span>
          </div>
          <div className="dashboard-stat">
            <span className="stat-label">Authors</span>
            <span className="stat-value">{stats.totalAuthors}</span>
          </div>
          <div className="dashboard-stat">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{stats.totalCategories}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions">
            <a href="/admin/collections/books/create" className="quick-action-btn">
              + New Book
            </a>
            <a href="/admin/collections/authors/create" className="quick-action-btn">
              + New Author
            </a>
            <a href="/admin/collections/chapters/create" className="quick-action-btn">
              + New Chapter
            </a>
          </div>
          <div className="quick-actions">
            <a href="/admin/collections/books?where[status][equals]=draft" className="quick-action-btn">
              View Drafts
            </a>
            <a href="/admin/collections/media" className="quick-action-btn">
              Manage Media
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <h3>🕒 Recent Activity</h3>
          <div className="recent-activity-list">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-type">
                      {item.type === 'book' ? '📚' : '📝'} {item.type}
                    </span>
                    <span className="activity-title">{item.title}</span>
                  </div>
                  <span className="activity-date">{formatDate(item.updatedAt)}</span>
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity</p>
            )}
          </div>
        </div>

        {/* Publishing Status */}
        <div className="dashboard-card">
          <h3>📊 Publishing Status</h3>
          <div className="status-chart">
            <div className="status-bar">
              <div 
                className="status-segment published"
                style={{ 
                  width: `${stats.totalBooks > 0 ? (stats.publishedBooks / stats.totalBooks) * 100 : 0}%` 
                }}
              ></div>
              <div 
                className="status-segment draft"
                style={{ 
                  width: `${stats.totalBooks > 0 ? (stats.draftBooks / stats.totalBooks) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="status-legend">
              <div className="legend-item">
                <span className="legend-color published"></span>
                <span>Published ({stats.publishedBooks})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color draft"></span>
                <span>Draft ({stats.draftBooks})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-dashboard {
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .dashboard-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 1.125rem;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .activity-type {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 500;
        }

        .activity-title {
          font-weight: 500;
          color: var(--text-primary);
        }

        .activity-date {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .no-activity {
          text-align: center;
          color: var(--text-secondary);
          font-style: italic;
          padding: 2rem 0;
        }

        .status-chart {
          margin-top: 1rem;
        }

        .status-bar {
          height: 8px;
          background-color: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          margin-bottom: 1rem;
        }

        .status-segment {
          height: 100%;
          transition: width 0.3s ease;
        }

        .status-segment.published {
          background-color: #059669;
        }

        .status-segment.draft {
          background-color: #d97706;
        }

        .status-legend {
          display: flex;
          gap: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.published {
          background-color: #059669;
        }

        .legend-color.draft {
          background-color: #d97706;
        }

        .dashboard-loading .animate-pulse > div {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  )
}