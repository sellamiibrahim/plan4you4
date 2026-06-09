import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/posts')
      setPosts(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const updatePost = async (post, updates) => {
    try {
      const res = await api.put(`/admin/posts/${post._id}`, updates)
      setPosts(prev => prev.map(item => item._id === post._id ? res.data : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update post')
    }
  }

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return
    try {
      await api.delete(`/admin/posts/${id}`)
      setPosts(prev => prev.filter(post => post._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete post')
    }
  }

  if (loading) return <div className="admin-state">Loading posts...</div>

  return (
    <section>
      <div className="admin-section-head">
        <h2>Posts</h2>
        <button className="admin-button secondary" onClick={fetchPosts}>Refresh</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table">
        <div className="admin-row admin-row-head">
          <span>Author</span>
          <span>Content</span>
          <span>Date</span>
          <span>Actions</span>
        </div>
        {posts.length === 0 ? (
          <div className="admin-empty">No posts found.</div>
        ) : posts.map(post => (
          <div className="admin-row" key={post._id}>
            <span>{post.author?.username || 'Unknown'}</span>
            <span>
              <input
                className="admin-input"
                defaultValue={post.content}
                onBlur={e => e.target.value !== post.content && updatePost(post, { content: e.target.value })}
              />
            </span>
            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}</span>
            <span className="admin-actions">
              <button className="admin-button danger" onClick={() => deletePost(post._id)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
