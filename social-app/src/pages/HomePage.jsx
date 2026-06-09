import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

export default function HomePage() {
  const [search, setSearch] = useState({ city: 'Tunis', type: 'Café', budget: '' })
  const [popular, setPopular] = useState([])
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await api.get('/plans/places/Tunis')
        setPopular(res.data.slice(0, 4))
      } catch (err) { console.error(err) }
    }

    const fetchPosts = async () => {
      try {
        const res = await api.get('/posts')
        setPosts(res.data)
      } catch (err) { console.error(err) }
      finally { setPostsLoading(false) }
    }

    fetchPopular()
    fetchPosts()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/results?city=${search.city}&type=${search.type}&budget=${search.budget}`)
  }

  return (
    <div style={s.container}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navLogo}>
          <span style={s.logoIcon}>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <div style={s.navLinks}>
          <button style={s.navLink}>Home</button>
          <button style={s.navLink} onClick={() => navigate('/results?city=Tunis&type=all&budget=500')}>Places</button>
          <button style={s.navLink}>About Us</button>
        </div>
        <div style={s.navActions}>
          {user ? (
            <>
              {(user.isAdmin || user.role === 'admin') && (
                <button style={s.adminBtn} onClick={() => navigate('/admin')}>
                  Admin
                </button>
              )}
              <button style={s.navLinkBtn} onClick={() => navigate(`/profile/${user._id}`)}>
                {user.username}
              </button>
              <button style={s.signupBtn} onClick={() => { logout(); navigate('/login') }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button style={s.navLinkBtn} onClick={() => navigate('/login')}>Login</button>
              <button style={s.signupBtn} onClick={() => navigate('/register')}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <h1 style={s.heroTitle}>plan4you</h1>
          <p style={s.heroSubtitle}>Trouvez les meilleurs endroits selon votre budget</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={s.searchBar}>
            <div style={s.searchField}>
              <span style={s.searchIcon}>📍</span>
              <select
                style={s.searchSelect}
                value={search.city}
                onChange={e => setSearch({ ...search, city: e.target.value })}
              >
                {['Tunis', 'Sousse', 'Sfax', 'Djerba', 'Hammamet', 'Monastir', 'Nabeul', 'Bizerte', 'Kairouan', 'Gabès', 'Gafsa', 'Tozeur', 'Tataouine', 'Médenine', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kasserine', 'Sidi Bouzid', 'Mahdia', 'Zaghouan', 'Ariana', 'Ben Arous'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={s.searchDivider} />
            <div style={s.searchField}>
              <span style={s.searchIcon}>☕</span>
              <select
                style={s.searchSelect}
                value={search.type}
                onChange={e => setSearch({ ...search, type: e.target.value })}
              >
                {['Café', 'Restaurant', 'Activité', 'Hébergement', 'Transport', 'Tout'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={s.searchDivider} />
            <div style={s.searchField}>
              <span style={s.searchIcon}>💰</span>
              <input
                style={s.searchInput}
                type="number"
                placeholder="Budget (DT)"
                value={search.budget}
                onChange={e => setSearch({ ...search, budget: e.target.value })}
              />
            </div>
            <button style={s.searchBtn} type="submit">Search</button>
          </form>
        </div>
      </div>

      {/* Popular Places */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Popular Places</h2>
          <button style={s.seeAll} onClick={() => navigate('/results?city=Tunis&type=all&budget=500')}>
            See all →
          </button>
        </div>

        <div style={s.placesGrid}>
          {popular.length === 0 ? (
            [1, 2, 3, 4].map(i => <div key={i} style={s.skeleton} />)
          ) : (
            popular.map((place, i) => (
              <div key={i} style={s.placeCard} onClick={() => navigate(`/place/${place._id}`)}>
                <div style={s.placeImgWrap}>
                  <img
                    src={place.image || `https://source.unsplash.com/300x200/?${encodeURIComponent(place.name + ' Tunisia')}`}
                    alt={place.name}
                    style={s.placeImg}
                    onError={e => { e.target.src = `https://source.unsplash.com/300x200/?tunisia,cafe` }}
                  />
                  <span style={{ ...s.categoryBadge, background: getCategoryColor(place.category) }}>
                    {place.category}
                  </span>
                </div>
                <div style={s.placeInfo}>
                  <h3 style={s.placeName}>{place.name}</h3>
                  <p style={s.placeCity}>📍 {place.wilaya}</p>
                  <div style={s.placeBottom}>
                    <span style={s.placeRating}>⭐ {Number(place.rating).toFixed(1)}</span>
                    <span style={s.placePrice}>{place.price === 0 ? 'Gratuit' : `${place.price} DT`}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Published Posts */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Posts publies</h2>
          <button style={s.createPostBtn} onClick={() => navigate('/create-post')}>
            Creer un post
          </button>
        </div>

        <div style={s.postsList}>
          {postsLoading ? (
            [1, 2, 3].map(i => <div key={i} style={s.postSkeleton} />)
          ) : posts.length === 0 ? (
            <div style={s.emptyPosts}>
              <p style={s.emptyTitle}>Aucun post pour l'instant</p>
              <p style={s.emptyText}>Publiez le premier post depuis votre compte.</p>
              <button style={s.createPostBtn} onClick={() => navigate('/create-post')}>
                Creer un post
              </button>
            </div>
          ) : (
            posts.map(post => (
              <article key={post._id} style={s.postCard}>
                <div style={s.postHeader}>
                  <div style={s.postAvatar}>
                    {post.author?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <button
                      style={s.postAuthor}
                      onClick={() => post.author?._id && navigate(`/profile/${post.author._id}`)}
                    >
                      @{post.author?.username || 'utilisateur'}
                    </button>
                    <p style={s.postDate}>
                      {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <p style={s.postContent}>{post.content}</p>
                {post.planId && (
                  <button style={s.showPlanBtn} onClick={() => navigate(`/plan/${post.planId}`)}>
                    Afficher le plan
                  </button>
                )}
                <div style={s.postActions}>
                  <span style={s.postAction}>{post.likes?.length || 0} likes</span>
                  <span style={s.postAction}>{post.comments?.length || 0} commentaires</span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <span style={s.logoIcon}>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <p style={s.footerText}>© 2025 plan4you — Tous droits réservés</p>
      </footer>
    </div>
  )
}

function getCategoryColor(cat) {
  const colors = {
    'restaurant': '#e8f5e9',
    'café': '#fff8e1',
    'activité': '#e3f2fd',
    'hébergement': '#fce4ec',
    'transport': '#ede7f6',
  }
  return colors[cat] || '#f5f5f5'
}

const s = {
  container: { minHeight: '100vh', background: '#f8f9fa' },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 3rem', background: '#fff',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoIcon: { fontSize: '1.4rem' },
  logoText: { fontSize: '1.2rem', fontWeight: '700', color: '#2d6a4f' },
  logoQ: { color: '#52b788' },
  navLinks: { display: 'flex', gap: '0.25rem' },
  navLink: {
    background: 'none', border: 'none', color: '#6c757d',
    cursor: 'pointer', fontSize: '0.95rem', padding: '0.5rem 1rem',
    borderRadius: '8px', fontWeight: '500',
  },
  navActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  navLinkBtn: {
    background: 'none', border: 'none', color: '#2d6a4f',
    cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
  },
  signupBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '0.5rem 1.25rem',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
  },
  adminBtn: {
    background: '#18212f', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '0.5rem 1rem',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700',
  },
  hero: {
    position: 'relative', height: '420px',
    background: 'url(https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1400) center/cover',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5))',
  },
  heroContent: {
    position: 'relative', zIndex: 1,
    textAlign: 'center', width: '100%', maxWidth: '800px', padding: '0 1rem',
  },
  heroTitle: { color: '#fff', fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '2rem' },
  searchBar: {
    background: '#fff', borderRadius: '16px',
    display: 'flex', alignItems: 'center',
    padding: '0.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    gap: '0',
  },
  searchField: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.5rem 1rem', flex: 1,
  },
  searchIcon: { fontSize: '1.1rem' },
  searchSelect: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: '0.95rem', color: '#1a1a2e', cursor: 'pointer', width: '100%',
  },
  searchInput: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: '0.95rem', color: '#1a1a2e', width: '100%',
  },
  searchDivider: { width: '1px', height: '30px', background: '#e9ecef' },
  searchBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '12px', padding: '0.75rem 2rem',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  section: { maxWidth: '1200px', margin: '3rem auto', padding: '0 2rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e' },
  seeAll: { background: 'none', border: 'none', color: '#2d6a4f', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
  placesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' },
  placeCard: {
    background: '#fff', borderRadius: '16px',
    overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s',
  },
  placeImgWrap: { position: 'relative' },
  placeImg: { width: '100%', height: '160px', objectFit: 'cover', display: 'block' },
  categoryBadge: {
    position: 'absolute', top: '0.75rem', left: '0.75rem',
    padding: '0.25rem 0.75rem', borderRadius: '20px',
    fontSize: '0.75rem', fontWeight: '600', color: '#2d6a4f',
  },
  placeInfo: { padding: '1rem' },
  placeName: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.25rem' },
  placeCity: { color: '#6c757d', fontSize: '0.8rem', marginBottom: '0.75rem' },
  placeBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  placeRating: { color: '#f59e0b', fontSize: '0.85rem', fontWeight: '600' },
  placePrice: { color: '#2d6a4f', fontSize: '0.9rem', fontWeight: '700' },
  skeleton: {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    borderRadius: '16px', height: '250px',
  },
  createPostBtn: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.65rem 1.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  postsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  postCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
  },
  postHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  postAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    flexShrink: 0,
  },
  postAuthor: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#2d6a4f',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '700',
  },
  postDate: { color: '#6c757d', fontSize: '0.8rem', margin: '0.2rem 0 0' },
  postContent: { color: '#1a1a2e', fontSize: '0.98rem', lineHeight: '1.7', margin: '0 0 1rem' },
  postActions: { display: 'flex', gap: '1rem', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' },
  showPlanBtn: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  postAction: { color: '#6c757d', fontSize: '0.85rem', fontWeight: '500' },
  postSkeleton: {
    height: '150px',
    borderRadius: '16px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  },
  emptyPosts: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
  },
  emptyTitle: { color: '#1a1a2e', fontSize: '1rem', fontWeight: '700', margin: '0 0 0.4rem' },
  emptyText: { color: '#6c757d', fontSize: '0.9rem', margin: '0 0 1rem' },
  footer: {
    background: '#1b4332', color: '#fff',
    padding: '2rem 3rem', marginTop: '3rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' },
}
