import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

export default function ProfilePage() {
  const [profile, setProfile]   = useState(null)
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const { user, logout }        = useAuth()
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const isOwner                 = user?._id === id

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/posts/user/${id}`),
      ])
      setProfile(profileRes.data)
      setPosts(postsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleFollow = async () => {
    try {
      await api.post(`/users/${id}/follow`)
      fetchProfile()
    } catch (err) { console.error(err) }
  }

  if (loading) return (
    <div style={s.loadingWrap}>
      <div style={s.spinner} />
      <p style={s.loadingText}>Chargement...</p>
    </div>
  )

  const isFollowing = profile?.followers?.includes(user?._id)

  return (
    <div style={s.container}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          <span>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <div style={s.navLinks}>
          <button style={s.navLink} onClick={() => navigate('/')}>Home</button>
          <button style={s.navLink} onClick={() => navigate('/results?city=Tunis&type=all&budget=500')}>Places</button>
          <button style={s.navLink} onClick={() => navigate('/plan')}>Plans</button>
        </div>
        <div style={s.navActions}>
          {isOwner && (
            <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login') }}>
              Logout
            </button>
          )}
          <button style={s.backBtn} onClick={() => navigate(-1)}>← Retour</button>
        </div>
      </nav>

      {/* Cover */}
      <div style={s.cover}>
        <div style={s.coverOverlay} />
        <div style={s.coverPattern} />
      </div>

      <div style={s.main}>
        {/* Profile Card */}
        <div style={s.profileCard}>
          <div style={s.profileLeft}>
            <div style={s.avatarWrap}>
              <div style={s.avatar}>
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              {isOwner && <div style={s.onlineDot} />}
            </div>
            <div style={s.profileInfo}>
              <h1 style={s.username}>@{profile?.username}</h1>
              <p style={s.email}>📧 {profile?.email}</p>
              <p style={s.joinDate}>📅 Membre depuis {new Date(profile?.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div style={s.profileRight}>
            {/* Stats */}
            <div style={s.stats}>
              <div style={s.stat}>
                <span style={s.statNum}>{posts.length}</span>
                <span style={s.statLabel}>Posts</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.stat}>
                <span style={s.statNum}>{profile?.followers?.length || 0}</span>
                <span style={s.statLabel}>Followers</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.stat}>
                <span style={s.statNum}>{profile?.following?.length || 0}</span>
                <span style={s.statLabel}>Following</span>
              </div>
            </div>

            {/* Actions */}
            <div style={s.actions}>
              {!isOwner ? (
                <button
                  style={{ ...s.followBtn, ...(isFollowing ? s.followingBtn : {}) }}
                  onClick={handleFollow}
                >
                  {isFollowing ? '✓ Abonné' : '+ Suivre'}
                </button>
              ) : (
                <button style={s.editBtn}>✏️ Modifier profil</button>
              )}
              {!isOwner && (
                <button style={s.msgBtn}>💬 Message</button>
              )}
              {isOwner && (
                <button style={s.planBtn} onClick={() => navigate('/plan')}>
                  ✨ Mes plans
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: 'posts', label: `📝 Posts (${posts.length})` },
            { key: 'plans', label: '🗺 Plans' },
            { key: 'reviews', label: '⭐ Reviews' },
          ].map(t => (
            <button
              key={t.key}
              style={{ ...s.tab, ...(activeTab === t.key ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div style={s.postsWrap}>
            {posts.length === 0 ? (
              <div style={s.emptyWrap}>
                <p style={s.emptyIcon}>📝</p>
                <p style={s.emptyTitle}>Aucun post pour l'instant</p>
                {isOwner && (
                  <button style={s.createBtn} onClick={() => navigate('/create-post')}>
                    Créer un post
                  </button>
                )}
              </div>
            ) : (
              posts.map(post => (
                <div key={post._id} style={s.postCard}>
                  <div style={s.postHeader}>
                    <div style={s.postAvatar}>
                      {profile?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={s.postUsername}>@{profile?.username}</p>
                      <p style={s.postDate}>
                        {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <p style={s.postContent}>{post.content}</p>
                  <div style={s.postActions}>
                    <button style={s.actionBtn}>❤ {post.likes?.length || 0}</button>
                    <button style={s.actionBtn}>💬 {post.comments?.length || 0}</button>
                    <button style={s.actionBtn}>↗ Partager</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div style={s.emptyWrap}>
            <p style={s.emptyIcon}>🗺</p>
            <p style={s.emptyTitle}>Aucun plan partagé</p>
            {isOwner && (
              <button style={s.createBtn} onClick={() => navigate('/plan')}>
                ✨ Créer un plan
              </button>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div style={s.emptyWrap}>
            <p style={s.emptyIcon}>⭐</p>
            <p style={s.emptyTitle}>Aucune review pour l'instant</p>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#f8f9fa' },
  loadingWrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '1rem',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '4px solid #e9ecef', borderTop: '4px solid #2d6a4f',
    borderRadius: '50%',
  },
  loadingText: { color: '#6c757d' },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: '#fff',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  logoText: { fontSize: '1.2rem', fontWeight: '700', color: '#2d6a4f' },
  logoQ: { color: '#52b788' },
  navLinks: { display: 'flex', gap: '0.25rem' },
  navLink: {
    background: 'none', border: 'none', color: '#6c757d',
    cursor: 'pointer', fontSize: '0.95rem', padding: '0.5rem 1rem',
    borderRadius: '8px', fontWeight: '500',
  },
  navActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  logoutBtn: {
    background: '#fff5f5', color: '#e53e3e',
    border: '1px solid #fed7d7', borderRadius: '8px',
    padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
  },
  backBtn: {
    background: '#f8f9fa', color: '#2d6a4f',
    border: '1.5px solid #e9ecef', borderRadius: '8px',
    padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
  },
  cover: {
    height: '220px', position: 'relative',
    background: 'linear-gradient(135deg, #2d6a4f, #52b788, #40916c)',
    overflow: 'hidden',
  },
  coverOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' },
  coverPattern: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)',
  },
  main: { maxWidth: '800px', margin: '-80px auto 2rem', padding: '0 1rem' },
  profileCard: {
    background: '#fff', borderRadius: '20px', padding: '1.5rem 2rem',
    marginBottom: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '1.5rem',
  },
  profileLeft: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: '90px', height: '90px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '800', fontSize: '2.5rem',
    border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  onlineDot: {
    position: 'absolute', bottom: '4px', right: '4px',
    width: '16px', height: '16px', borderRadius: '50%',
    background: '#52b788', border: '2px solid #fff',
  },
  profileInfo: {},
  username: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.25rem' },
  email: { color: '#6c757d', fontSize: '0.9rem', marginBottom: '0.25rem' },
  joinDate: { color: '#6c757d', fontSize: '0.85rem' },
  profileRight: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' },
  stats: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  statNum: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statDivider: { width: '1px', height: '30px', background: '#e9ecef' },
  actions: { display: 'flex', gap: '0.75rem' },
  followBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.6rem 1.5rem',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
  },
  followingBtn: {
    background: '#f8f9fa', color: '#2d6a4f',
    border: '1.5px solid #2d6a4f',
  },
  msgBtn: {
    background: '#f8f9fa', color: '#1a1a2e',
    border: '1.5px solid #e9ecef', borderRadius: '10px',
    padding: '0.6rem 1.5rem', cursor: 'pointer', fontSize: '0.9rem',
  },
  editBtn: {
    background: '#f8f9fa', color: '#1a1a2e',
    border: '1.5px solid #e9ecef', borderRadius: '10px',
    padding: '0.6rem 1.5rem', cursor: 'pointer', fontSize: '0.9rem',
  },
  planBtn: {
    background: '#d8f3dc', color: '#2d6a4f',
    border: '1.5px solid #2d6a4f', borderRadius: '10px',
    padding: '0.6rem 1.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
  },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: {
    flex: 1, padding: '0.75rem',
    background: '#fff', color: '#6c757d',
    border: '1.5px solid #e9ecef',
    borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  tabActive: {
    background: '#d8f3dc', color: '#2d6a4f',
    border: '1.5px solid #2d6a4f', fontWeight: '600',
  },
  postsWrap: {},
  postCard: {
    background: '#fff', borderRadius: '16px', padding: '1.25rem',
    marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  postHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  postAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '1rem', flexShrink: 0,
  },
  postUsername: { color: '#2d6a4f', fontWeight: '600', margin: 0, fontSize: '0.95rem' },
  postDate: { color: '#6c757d', fontSize: '0.8rem', margin: 0 },
  postContent: { color: '#1a1a2e', lineHeight: '1.6', marginBottom: '1rem', fontSize: '0.95rem' },
  postActions: {
    display: 'flex', gap: '0.75rem',
    borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem',
  },
  actionBtn: {
    background: 'none', border: 'none', color: '#6c757d',
    cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem 0.6rem',
    borderRadius: '8px',
  },
  emptyWrap: { textAlign: 'center', padding: '3rem' },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  emptyTitle: { color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' },
  createBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.75rem 2rem',
    cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
  },
}
