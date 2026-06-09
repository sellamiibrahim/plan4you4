import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', formData)
      localStorage.setItem('token', res.data.token)
      login(res.data.user)
      if (res.data.user?.isAdmin || res.data.user?.role === 'admin') {
        navigate('/admin')
        return
      }
      const params = new URLSearchParams(window.location.search)
      if (params.get('onboarding') === 'true') {
        navigate('/onboarding')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <span style={s.logoIcon}>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>

        <h2 style={s.title}>Welcome Back!</h2>
        <p style={s.subtitle}>Login to your account</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
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
            <div style={s.passWrap}>
              <input
                style={{ ...s.input, paddingRight: '3rem' }}
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            <p style={s.forgot}>Forgot password?</p>
          </div>

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Login'}
          </button>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <span style={s.dividerLine} />
          </div>

          <button type="button" style={s.socialBtn}>
            <img src="https://www.google.com/favicon.ico" width="18" alt="G" />
            Login with Google
          </button>
          <button type="button" style={{ ...s.socialBtn, marginTop: '0.5rem' }}>
            <span style={{ color: '#1877f2', fontSize: '1.1rem' }}>f</span>
            Login with Facebook
          </button>
        </form>

        <p style={s.registerLink}>
          Don't have an account?{' '}
          <Link to="/register" style={s.link}>Sign Up</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  logoIcon: { fontSize: '1.5rem' },
  logoText: { fontSize: '1.3rem', fontWeight: '700', color: '#2d6a4f' },
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
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)', background: 'none',
    border: 'none', cursor: 'pointer', fontSize: '1rem',
  },
  forgot: { color: '#2d6a4f', fontSize: '0.8rem', textAlign: 'right', cursor: 'pointer', fontWeight: '500' },
  btn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.9rem',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
    marginTop: '0.5rem',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' },
  dividerLine: { flex: 1, height: '1px', background: '#e9ecef' },
  dividerText: { color: '#6c757d', fontSize: '0.85rem' },
  socialBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    background: '#fff', border: '1.5px solid #e9ecef',
    borderRadius: '10px', padding: '0.75rem',
    fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', color: '#1a1a2e',
  },
  registerLink: { color: '#6c757d', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' },
  link: { color: '#2d6a4f', fontWeight: '600' },
}
