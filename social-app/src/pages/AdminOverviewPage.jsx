import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin')
      setOverview(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load admin overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  if (loading) return <div className="admin-state">Loading overview...</div>

  const stats = overview?.stats || {}
  const cards = [
    { label: 'Users', value: stats.totalUsers || 0 },
    { label: 'Posts', value: stats.totalPosts || 0 },
    { label: 'Reviews', value: stats.totalReviews || 0 },
    { label: 'Pending reviews', value: stats.pendingReviews || 0 },
  ]

  return (
    <section>
      <div className="admin-section-head">
        <div>
          <h2>Overview</h2>
          <p className="admin-subtitle">Monitor platform activity and moderation queues.</p>
        </div>
        <button className="admin-button secondary" onClick={fetchOverview}>Refresh</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-stats-grid">
        {cards.map(card => (
          <div className="admin-stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-split">
        <div className="admin-panel">
          <h3>Recent posts</h3>
          <div className="admin-list">
            {(overview?.recentPosts || []).length === 0 ? (
              <div className="admin-empty">No recent posts.</div>
            ) : overview.recentPosts.map(post => (
              <article className="admin-list-item" key={post._id}>
                <div>
                  <strong>{post.author?.username || 'Unknown'}</strong>
                  <p>{post.content || post.title || 'No content'}</p>
                </div>
                <span>{formatDate(post.createdAt)}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <h3>Recent reviews</h3>
          <div className="admin-list">
            {(overview?.recentReviews || []).length === 0 ? (
              <div className="admin-empty">No recent reviews.</div>
            ) : overview.recentReviews.map(review => (
              <article className="admin-list-item" key={review._id}>
                <div>
                  <strong>{review.author?.username || 'Unknown'} - {review.rating}/5</strong>
                  <p>{review.comment || review.post?.title || 'No comment'}</p>
                </div>
                <span className={`admin-badge ${review.status || 'pending'}`}>
                  {review.status || 'pending'}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
