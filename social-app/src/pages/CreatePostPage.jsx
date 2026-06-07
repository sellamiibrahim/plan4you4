import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

export default function CreatePostPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const trimmedContent = content.trim()
  const canSubmit = trimmedContent.length > 0 && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!trimmedContent) {
      setError('Ecrivez quelque chose avant de publier.')
      return
    }

    try {
      setLoading(true)
      await api.post('/posts', { content: trimmedContent })
      navigate(`/profile/${user?._id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de publier le post.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      <nav style={s.navbar}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          <span style={s.logoIcon}>map</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <div style={s.navLinks}>
          <button style={s.navLink} onClick={() => navigate('/')}>Home</button>
          <button style={s.navLink} onClick={() => navigate('/results?city=Tunis&type=all&budget=500')}>Places</button>
          <button style={s.navLink} onClick={() => navigate('/plan')}>Plans</button>
        </div>
        <button style={s.backBtn} onClick={() => navigate(-1)}>Retour</button>
      </nav>

      <main style={s.main}>
        <section style={s.card}>
          <div style={s.header}>
            <div style={s.avatar}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={s.title}>Creer un post</h1>
              <p style={s.subtitle}>Publier en tant que @{user?.username}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              style={s.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez votre idee, votre experience ou un bon plan..."
              rows={8}
              maxLength={1000}
              autoFocus
            />

            <div style={s.metaRow}>
              <span style={s.counter}>{content.length}/1000</span>
              {error && <span style={s.error}>{error}</span>}
            </div>

            <div style={s.actions}>
              <button type="button" style={s.cancelBtn} onClick={() => navigate(-1)}>
                Annuler
              </button>
              <button type="submit" style={{ ...s.submitBtn, ...(!canSubmit ? s.submitBtnDisabled : {}) }} disabled={!canSubmit}>
                {loading ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#f8f9fa' },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    background: '#fff',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  logoIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: '#d8f3dc',
    color: '#2d6a4f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  logoText: { fontSize: '1.2rem', fontWeight: '700', color: '#2d6a4f' },
  navLinks: { display: 'flex', gap: '0.25rem' },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    fontSize: '0.95rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '500',
  },
  backBtn: {
    background: '#f8f9fa',
    color: '#2d6a4f',
    border: '1.5px solid #e9ecef',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  main: { maxWidth: '760px', margin: '2rem auto', padding: '0 1rem' },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1.2rem',
    flexShrink: 0,
  },
  title: { color: '#1a1a2e', fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.25rem' },
  subtitle: { color: '#6c757d', fontSize: '0.9rem', margin: 0 },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1.5px solid #e9ecef',
    borderRadius: '12px',
    padding: '1rem',
    color: '#1a1a2e',
    fontSize: '1rem',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    background: '#fff',
    fontFamily: 'inherit',
  },
  metaRow: {
    minHeight: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  counter: { color: '#adb5bd', fontSize: '0.8rem' },
  error: { color: '#e53e3e', fontSize: '0.85rem', textAlign: 'right' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' },
  cancelBtn: {
    background: '#f8f9fa',
    color: '#6c757d',
    border: '1.5px solid #e9ecef',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  submitBtn: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.75rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  submitBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
}
