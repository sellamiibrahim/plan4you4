import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/reviews')
      setReviews(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const updateReview = async (review, updates) => {
    try {
      const res = await api.put(`/admin/reviews/${review._id}`, updates)
      setReviews(prev => prev.map(item => item._id === review._id ? res.data : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update review')
    }
  }

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await api.delete(`/admin/reviews/${id}`)
      setReviews(prev => prev.filter(review => review._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete review')
    }
  }

  if (loading) return <div className="admin-state">Loading reviews...</div>

  return (
    <section>
      <div className="admin-section-head">
        <h2>Reviews</h2>
        <button className="admin-button secondary" onClick={fetchReviews}>Refresh</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table">
        <div className="admin-row admin-row-head">
          <span>Author</span>
          <span>Review</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {reviews.length === 0 ? (
          <div className="admin-empty">No reviews found.</div>
        ) : reviews.map(review => (
          <div className="admin-row" key={review._id}>
            <span>{review.author?.username || 'Unknown'}</span>
            <span>
              <strong>{review.rating}/5</strong>
              <span className="admin-muted">{review.comment || 'No comment'}</span>
            </span>
            <span>
              <select
                className="admin-input"
                value={review.status || 'pending'}
                onChange={e => updateReview(review, { status: e.target.value })}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </span>
            <span className="admin-actions">
              <button className="admin-button danger" onClick={() => deleteReview(review._id)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
