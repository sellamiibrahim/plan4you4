import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateUser = async (targetUser, updates) => {
    try {
      const res = await api.put(`/admin/users/${targetUser._id}`, updates)
      setUsers(prev => prev.map(item => item._id === targetUser._id ? res.data : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user')
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(item => item._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete user')
    }
  }

  if (loading) return <div className="admin-state">Loading users...</div>

  return (
    <section>
      <div className="admin-section-head">
        <div>
          <h2>Users</h2>
          <p className="admin-subtitle">Review accounts and assign admin access.</p>
        </div>
        <button className="admin-button secondary" onClick={fetchUsers}>Refresh</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table users">
        <div className="admin-row admin-row-head">
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>
        {users.length === 0 ? (
          <div className="admin-empty">No users found.</div>
        ) : users.map(user => {
          const isCurrentUser = currentUser?._id === user._id
          return (
            <div className="admin-row" key={user._id}>
              <span>
                <strong>{user.username}</strong>
                {isCurrentUser && <small className="admin-muted">You</small>}
              </span>
              <span>{user.email}</span>
              <span>
                <select
                  className="admin-input"
                  value={user.role || (user.isAdmin ? 'admin' : 'user')}
                  onChange={e => updateUser(user, { role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </span>
              <span>{formatDate(user.createdAt)}</span>
              <span className="admin-actions">
                <button
                  className="admin-button danger"
                  disabled={isCurrentUser}
                  onClick={() => deleteUser(user._id)}
                >
                  Delete
                </button>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
