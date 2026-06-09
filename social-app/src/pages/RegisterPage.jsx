import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/useAuth'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()
  const { login }             = useAuth()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: formData.username,
        email:    formData.email,
        password: formData.password,
        preferences: {
          wilaya: null,
          interests: [],
          budget: null,
          travelStyle: null,
        },
      })
      // Auto-login after successful registration so onboarding can save preferences
      try {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password })
        localStorage.setItem('token', res.data.token)
        login(res.data.user)
        navigate('/onboarding')
        return
      } catch {
        // If auto-login fails, fallback to login page with onboarding flag
        navigate('/login?onboarding=true')
        return
      }
    } catch (err) {
      console.error('Register error:', err)
      // Build a clearer message for debugging: include status and response body when available
      const status = err.response?.status
      const respData = err.response?.data
      const respMsg = respData?.message || (typeof respData === 'string' ? respData : null)
      const msgParts = []
      if (respMsg) msgParts.push(respMsg)
      if (status) msgParts.push(`status: ${status}`)
      if (respData && !respMsg) msgParts.push(JSON.stringify(respData))
      const finalMsg = msgParts.join(' — ') || err.message || 'Erreur inscription'
      setError(finalMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      {/* Left — Image */}
      <div style={s.left}>
        <div style={s.leftOverlay} />
        <div style={s.leftContent}>
          <div style={s.logoWrap}>
            <span>🗺</span>
            <span style={s.logoText}>plan4you</span>
          </div>
          <h2 style={s.leftTitle}>Découvre la Tunisie<br/>comme jamais</h2>
          <p style={s.leftDesc}>Plans personnalisés, places réelles, communauté active.</p>
          <div style={s.features}>
            {[
              '✓ 24 wilayas disponibles',
              '✓ Places réelles w ratings',
              '✓ Plans selon ton budget',
              '✓ 100% gratuit',
            ].map((f, i) => (
              <p key={i} style={s.feature}>{f}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardLogoWrap}>
            <span>🗺</span>
            <span style={s.cardLogoText}>plan4you</span>
          </div>

          <h2 style={s.title}>Create Account</h2>
          <p style={s.subtitle}>Join us today!</p>

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input
                style={s.input}
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              
            </div>

            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                style={s.input}
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Confirm Password</label>
              <input
                style={s.input}
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Inscription...' : 'Sign Up'}
            </button>
          </form>

          <p style={s.loginLink}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', display: 'flex' },
  left: {
    flex: 1,
    background: 'url(https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800) center/cover',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  leftOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, rgba(45,106,79,0.85), rgba(27,67,50,0.9))',
  },
  leftContent: {
    position: 'relative', zIndex: 1,
    padding: '3rem', maxWidth: '400px',
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' },
  logoText: { fontSize: '1.4rem', fontWeight: '700', color: '#fff' },
  logoQ: { color: '#52b788' },
  leftTitle: {
    fontSize: '2.2rem', fontWeight: '800', color: '#fff',
    lineHeight: '1.2', marginBottom: '1rem',
  },
  leftDesc: { color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' },
  features: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  feature: { color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', fontWeight: '500' },
  right: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '2rem', background: '#f8f9fa',
  },
  card: {
    background: '#fff', borderRadius: '20px', padding: '2.5rem',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  cardLogoWrap: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  cardLogoText: { fontSize: '1.2rem', fontWeight: '700', color: '#2d6a4f' },
  title: { fontSize: '1.6rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.25rem' },
  subtitle: { color: '#6c757d', marginBottom: '1.5rem', fontSize: '0.9rem' },
  error: {
    background: '#fff5f5', border: '1px solid #fed7d7',
    color: '#e53e3e', borderRadius: '10px',
    padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#1a1a2e', fontSize: '0.85rem', fontWeight: '600' },
  input: {
    background: '#fff', border: '1.5px solid #e9ecef',
    borderRadius: '10px', padding: '0.85rem 1rem',
    color: '#1a1a2e', fontSize: '0.95rem', outline: 'none',
    width: '100%',
  },
  btn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.9rem',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem',
  },
  loginLink: { color: '#6c757d', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' },
  link: { color: '#2d6a4f', fontWeight: '600' },
}
