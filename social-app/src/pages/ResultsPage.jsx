import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

export default function ResultsPage() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('Popular')
  const [filters, setFilters] = useState({ type: '', minRating: 0, maxBudget: 500 })
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const city = searchParams.get('city') || 'Tunis'
  const type = searchParams.get('type') || 'all'
  const budget = searchParams.get('budget') || 500

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/plans/places/${city}`)
        setPlaces(res.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }

    fetchPlaces()
  }, [city])

  const filtered = places
    .filter(p => filters.type ? p.category === filters.type : true)
    .filter(p => p.rating >= filters.minRating)
    .filter(p => p.price <= filters.maxBudget)
    .sort((a, b) =>
      sortBy === 'Popular' ? b.rating - a.rating :
        sortBy === 'Price' ? a.price - b.price : 0
    )

  return (
    <div style={s.container}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          <span>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <div style={s.searchMini}>
          <input
            style={s.searchMiniInput}
            placeholder={`${city} — ${type} — ${budget} DT`}
            readOnly
            onClick={() => navigate('/')}
          />
        </div>
        <div style={s.navActions}>
          <button style={s.iconBtn}>🤍</button>
          <button style={s.iconBtn} onClick={() => navigate(`/profile/${user?._id}`)}>👤</button>
        </div>
      </nav>

      <div style={s.main}>
        {/* Sidebar Filter */}
        <div style={s.sidebar}>
          <h3 style={s.filterTitle}>Filter</h3>

          <div style={s.filterSection}>
            <h4 style={s.filterLabel}>Type</h4>
            {['', 'café', 'restaurant', 'activité', 'hébergement', 'transport'].map(t => (
              <label key={t} style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={filters.type === t}
                  onChange={() => setFilters({ ...filters, type: filters.type === t ? '' : t })}
                  style={{ accentColor: '#2d6a4f' }}
                />
                <span style={s.checkText}>
                  {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
                {filters.type === t && t !== '' && <span style={s.checkMark}>✓</span>}
              </label>
            ))}
          </div>

          <div style={s.filterSection}>
            <h4 style={s.filterLabel}>Budget max</h4>
            <div style={s.budgetRange}>
              <span style={s.budgetText}>0</span>
              <input
                type="range" min="0" max="500" step="10"
                value={filters.maxBudget}
                onChange={e => setFilters({ ...filters, maxBudget: Number(e.target.value) })}
                style={{ flex: 1, accentColor: '#2d6a4f' }}
              />
              <span style={s.budgetText}>{filters.maxBudget} DT</span>
            </div>
          </div>

          <div style={s.filterSection}>
            <h4 style={s.filterLabel}>Rating minimum</h4>
            {[
              { val: 0, label: 'All' },
              { val: 3, label: '⭐⭐⭐ & up' },
              { val: 3.5, label: '⭐⭐⭐½ & up' },
              { val: 4, label: '⭐⭐⭐⭐ & up' },
              { val: 4.5, label: '⭐⭐⭐⭐½ & up' },
            ].map(r => (
              <label key={r.val} style={s.checkLabel}>
                <input
                  type="radio"
                  checked={filters.minRating === r.val}
                  onChange={() => setFilters({ ...filters, minRating: r.val })}
                  style={{ accentColor: '#2d6a4f' }}
                />
                <span style={s.checkText}>{r.label}</span>
              </label>
            ))}
          </div>

          <button
            style={s.resetBtn}
            onClick={() => setFilters({ type: '', minRating: 0, maxBudget: 500 })}
          >
            Réinitialiser filtres
          </button>
        </div>

        {/* Results */}
        <div style={s.results}>
          <div style={s.resultsHeader}>
            <div>
              <h2 style={s.resultsTitle}>
                Results for "{city} — {type} — {budget} DT"
              </h2>
              <p style={s.resultsCount}>{filtered.length} places found</p>
            </div>
            <div style={s.sortWrap}>
              <span style={s.sortLabel}>Sort by:</span>
              <select
                style={s.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option>Popular</option>
                <option>Price</option>
                <option>Rating</option>
              </select>
            </div>
          </div>

          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} style={s.skeleton} />)
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <p style={{ fontSize: '3rem' }}>🔍</p>
              <p style={{ color: '#6c757d', marginTop: '1rem' }}>Aucune place trouvée</p>
              <button
                style={s.resetBtn}
                onClick={() => setFilters({ type: '', minRating: 0, maxBudget: 500 })}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filtered.map((place, i) => (
              <div key={i} style={s.placeCard}>
                <img
                  src={place.image || `https://source.unsplash.com/200x150/?${encodeURIComponent(place.name + ' Tunisia')}`}
                  alt={place.name}
                  style={s.placeImg}
                  onError={e => { e.target.src = 'https://source.unsplash.com/200x150/?tunisia,food' }}
                />
                <div style={s.placeInfo}>
                  <div style={s.placeTop}>
                    <span style={{
                      ...s.typeBadge,
                      background: categoryBg[place.category] || '#f0f0f0',
                      color: categoryTxt[place.category] || '#333',
                    }}>
                      {place.category}
                    </span>
                  </div>
                  <h3 style={s.placeName}>{place.name}</h3>
                  <p style={s.placeCity}>📍 {place.wilaya}</p>
                  <p style={s.placeDesc}>
                    {place.description || `${place.category} situé à ${place.wilaya}.`}
                  </p>
                  <div style={s.placeRatingWrap}>
                    <span style={s.starsText}>
                      {'⭐'.repeat(Math.floor(place.rating))}
                    </span>
                    <span style={s.ratingNum}>{Number(place.rating).toFixed(1)}</span>
                    <span style={s.reviewCount}>
                      ({Math.floor(Math.random() * 200 + 50)} reviews)
                    </span>
                  </div>
                </div>
                <div style={s.placeRight}>
                  <span style={s.placePrice}>
                    {place.price === 0 ? 'Gratuit' : `${place.price} DT`}
                  </span>
                  <button
                    style={s.viewBtn}
                    onClick={() => navigate(`/place/${place._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const categoryBg = {
  'restaurant': '#e8f5e9',
  'café': '#fff8e1',
  'activité': '#e3f2fd',
  'hébergement': '#fce4ec',
  'transport': '#ede7f6',
}

const categoryTxt = {
  'restaurant': '#2d6a4f',
  'café': '#f59e0b',
  'activité': '#1565c0',
  'hébergement': '#c2185b',
  'transport': '#6a1b9a',
}

const s = {
  container: { minHeight: '100vh', background: '#f8f9fa' },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: '#fff',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  logoText: { fontSize: '1.2rem', fontWeight: '700', color: '#2d6a4f' },
  logoQ: { color: '#52b788' },
  searchMini: { flex: 1, maxWidth: '380px', margin: '0 2rem' },
  searchMiniInput: {
    width: '100%', padding: '0.6rem 1rem',
    border: '1.5px solid #e9ecef', borderRadius: '10px',
    background: '#f8f9fa', cursor: 'pointer',
    outline: 'none', fontSize: '0.9rem', color: '#6c757d',
  },
  navActions: { display: 'flex', gap: '0.5rem' },
  iconBtn: {
    background: 'none', border: '1.5px solid #e9ecef',
    borderRadius: '8px', padding: '0.5rem 0.75rem',
    cursor: 'pointer', fontSize: '1rem',
  },
  main: {
    maxWidth: '1200px', margin: '0 auto', padding: '2rem',
    display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem',
  },
  sidebar: {
    background: '#fff', borderRadius: '16px', padding: '1.5rem',
    height: 'fit-content', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    position: 'sticky', top: '80px',
  },
  filterTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1.5rem' },
  filterSection: { marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f0f0f0' },
  filterLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e', marginBottom: '0.75rem' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' },
  checkText: { fontSize: '0.9rem', color: '#495057', flex: 1 },
  checkMark: { color: '#2d6a4f', fontWeight: '700' },
  budgetRange: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  budgetText: { fontSize: '0.8rem', color: '#6c757d', whiteSpace: 'nowrap' },
  resetBtn: {
    width: '100%', background: '#f8f9fa', color: '#6c757d',
    border: '1.5px solid #e9ecef', borderRadius: '10px',
    padding: '0.6rem', cursor: 'pointer', fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  results: {},
  resultsHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '1.5rem',
  },
  resultsTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.25rem' },
  resultsCount: { color: '#6c757d', fontSize: '0.85rem' },
  sortWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  sortLabel: { color: '#6c757d', fontSize: '0.9rem' },
  sortSelect: {
    border: '1.5px solid #e9ecef', borderRadius: '8px',
    padding: '0.4rem 0.75rem', outline: 'none',
    fontSize: '0.9rem', color: '#1a1a2e', background: '#fff',
  },
  placeCard: {
    background: '#fff', borderRadius: '16px', padding: '1rem',
    marginBottom: '1rem', display: 'flex', gap: '1.25rem',
    alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  placeImg: {
    width: '160px', height: '120px',
    borderRadius: '12px', objectFit: 'cover', flexShrink: 0,
  },
  placeInfo: { flex: 1 },
  placeTop: { marginBottom: '0.5rem' },
  typeBadge: {
    fontSize: '0.75rem', fontWeight: '600',
    padding: '0.2rem 0.75rem', borderRadius: '20px',
  },
  placeName: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.25rem' },
  placeCity: { color: '#6c757d', fontSize: '0.85rem', marginBottom: '0.5rem' },
  placeDesc: { color: '#495057', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '0.75rem' },
  placeRatingWrap: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  starsText: { fontSize: '0.8rem' },
  ratingNum: { color: '#f59e0b', fontWeight: '700', fontSize: '0.9rem' },
  reviewCount: { color: '#6c757d', fontSize: '0.8rem' },
  placeRight: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', justifyContent: 'space-between',
    minHeight: '100px', flexShrink: 0,
  },
  placePrice: { fontSize: '1.2rem', fontWeight: '700', color: '#2d6a4f' },
  viewBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.6rem 1.25rem',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
  },
  skeleton: {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
    borderRadius: '16px', height: '130px', marginBottom: '1rem',
  },
  empty: { textAlign: 'center', padding: '4rem' },
}
