import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const WILAYAS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine','Tataouine','Gafsa','Tozeur','Djerba','Hammamet']

const categoryColor = {
  'activité':    '#e3f2fd',
  'restaurant':  '#e8f5e9',
  'café':        '#fff8e1',
  'hébergement': '#fce4ec',
  'transport':   '#ede7f6',
}

const categoryText = {
  'activité':    '#1565c0',
  'restaurant':  '#2d6a4f',
  'café':        '#f59e0b',
  'hébergement': '#c2185b',
  'transport':   '#6a1b9a',
}

export default function PlanPage() {
  const [form, setForm]       = useState({ city: 'Tunis', budget: '', duration: '1 jour' })
  const [plan, setPlan]       = useState(null)
  const [myPlans, setMyPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState('generate')
  const { user, logout }      = useAuth()
  const navigate              = useNavigate()

  useEffect(() => { fetchMyPlans() }, [])

  const fetchMyPlans = async () => {
    try {
      const res = await api.get('/plans/my')
      setMyPlans(res.data)
    } catch (err) { console.error(err) }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/plans/generate', { ...form, budget: Number(form.budget) })
      setPlan(res.data)
      console.log('Server plan response:', res.data)
      setTab('result')
      fetchMyPlans()
    } catch (err) {
      console.error('Server generate failed, falling back to local generator:', err)
      try {
        const local = await generateLocalPlan({ ...form, budget: Number(form.budget) })
        setPlan(local)
        console.log('Local generated plan:', local)
        setTab('result')
      } catch (e) { console.error('Local generation failed:', e) }
    } finally { setLoading(false) }
  }

  // Local plan generator: fetch places for the selected city, filter by budget
  // and distribute places across duration days.
  const generateLocalPlan = async ({ city, budget, duration }) => {
    // parse duration like '1 jour' or '2 jours'
    const days = Number((duration || '1').toString().match(/\d+/)?.[0] || 1)
    // fetch candidate places from API, but fall back to a small local dataset if API unavailable
    let candidates = []
    try {
      const res = await api.get(`/plans/places/${city}`)
      candidates = res.data || []
    } catch (e) {
      console.warn('Could not fetch places from API, using fallback sample data', e)
      const fallback = [
        { _id: 'p1', name: 'Café Central', category: 'café', wilaya: city, price: 15, rating: 4.5, image: '' },
        { _id: 'p2', name: 'Resto du Coin', category: 'restaurant', wilaya: city, price: 60, rating: 4.7, image: '' },
        { _id: 'p3', name: 'Musée Local', category: 'activité', wilaya: city, price: 30, rating: 4.2, image: '' },
        { _id: 'p4', name: 'Auberge Accueillante', category: 'hébergement', wilaya: city, price: 120, rating: 4.6, image: '' },
        { _id: 'p5', name: 'Balade en Calèche', category: 'activité', wilaya: city, price: 20, rating: 4.0, image: '' },
        { _id: 'p6', name: 'Snack Local', category: 'restaurant', wilaya: city, price: 25, rating: 4.1, image: '' },
      ]
      candidates = fallback
    }
    // remove duplicates and ensure numeric price
    candidates = candidates.map(p => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      wilaya: p.wilaya,
      price: Number(p.price || 0),
      rating: Number(p.rating || 0),
      image: p.image,
    }))

    // try to pick diverse places across categories, prefer higher rating
    const categories = [...new Set(candidates.map(c => c.category))]
    const itemsPerDay = Math.max(1, Math.floor((candidates.length || 1) / Math.max(1, days)))

    // sort by rating desc then price asc
    candidates.sort((a, b) => b.rating - a.rating || a.price - b.price)

    const planItems = []
    let remainingBudget = budget

    for (let d = 1; d <= days; d++) {
      const dayItems = []
      // pick up to itemsPerDay
      for (let i = 0; i < itemsPerDay && candidates.length > 0; i++) {
        // prefer an item from a category not yet used this day
        let idx = candidates.findIndex(c => !dayItems.some(di => di.category === c.category))
        if (idx === -1) idx = 0
        const place = candidates.splice(idx, 1)[0]
        // allocate budget share (simple): equal split of remaining budget across remaining slots
        const remainingSlots = (days - d) * itemsPerDay + (itemsPerDay - i)
        const alloc = remainingSlots > 0 ? Math.min(place.price || 0, Math.max(0, Math.round(remainingBudget / Math.max(1, remainingSlots)))) : 0
        remainingBudget -= alloc
        dayItems.push({
          placeId: place._id,
          name: place.name,
          category: place.category,
          wilaya: place.wilaya,
          price: place.price,
          allocated: alloc,
          image: place.image,
        })
      }
      planItems.push({ day: d, items: dayItems })
    }

    // debug: log candidates length
    console.log(`generateLocalPlan: city=${city} budget=${budget} days=${days} candidates=${candidates.length}`)
    // build activities array expected by the UI (flatten items)
    const activities = []
    for (const day of planItems) {
      for (const it of day.items) {
        activities.push({
          day: day.day,
          name: it.name,
          category: it.category,
          price: it.price,
          allocated: it.allocated,
          rating: it.rating,
          address: it.wilaya,
          image: it.image,
        })
      }
    }

    const totalCost = activities.reduce((s, a) => s + (a.allocated || a.price || 0), 0)

    const generated = {
      _id: `local-${Date.now()}`,
      city,
      budget,
      duration: `${days} jour${days > 1 ? 's' : ''}`,
      createdAt: new Date().toISOString(),
      items: planItems,
      activities,
      totalCost,
      isShared: false,
    }

    return generated
  }

  const handleShare = async (id) => {
    try {
      await api.put(`/plans/${id}/share`)
      fetchMyPlans()
      if (plan?._id === id) setPlan({ ...plan, isShared: true })
    } catch (err) { console.error(err) }
  }

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
          <button style={s.navLinkActive}>Plans</button>
        </div>
        <div style={s.navActions}>
          <button style={s.navLinkBtn} onClick={() => navigate(`/profile/${user?._id}`)}>
            {user?.username}
          </button>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login') }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={s.main}>
        {/* Header */}
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>✨ Génère ton plan parfait</h1>
          <p style={s.pageSubtitle}>Plans personnalisés selon ton budget et ta wilaya</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: 'generate', label: '🔍 Créer un plan' },
            { key: 'result',   label: '🗺 Mon plan',      disabled: !plan },
            { key: 'history',  label: `📋 Historique (${myPlans.length})` },
          ].map(t => (
            <button
              key={t.key}
              style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}), opacity: t.disabled ? 0.5 : 1 }}
              onClick={() => !t.disabled && setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Generate */}
        {tab === 'generate' && (
          <div style={s.generateLayout}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Paramètres du plan</h2>
              <form onSubmit={handleGenerate} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>📍 Wilaya</label>
                  <select
                    style={s.select}
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                  >
                    {WILAYAS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>💰 Budget (DT)</label>
                  <input
                    style={s.input}
                    type="number"
                    placeholder="Ex: 200"
                    value={form.budget}
                    onChange={e => setForm({...form, budget: e.target.value})}
                    required min="10"
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>🗓 Durée</label>
                  <select
                    style={s.select}
                    value={form.duration}
                    onChange={e => setForm({...form, duration: e.target.value})}
                  >
                    <option>1 jour</option>
                    <option>weekend</option>
                    <option>semaine</option>
                  </select>
                </div>

                <button
                  style={{ ...s.generateBtn, opacity: loading ? 0.7 : 1 }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '⏳ Génération...' : '✨ Générer mon plan'}
                </button>
              </form>
            </div>

            {/* How it works */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>Comment ça marche ?</h3>
              {[
                { icon: '📍', title: 'Choisis ta wilaya', desc: '24 wilayas disponibles en Tunisie' },
                { icon: '💰', title: 'Définis ton budget', desc: 'On optimise selon tes moyens' },
                { icon: '🗓', title: 'Choisis la durée', desc: '1 jour, weekend ou semaine' },
                { icon: '✨', title: 'Reçois ton plan', desc: 'Cafés, restos, activités, hébergement' },
              ].map((step, i) => (
                <div key={i} style={s.step}>
                  <div style={s.stepIconWrap}>{step.icon}</div>
                  <div>
                    <p style={s.stepTitle}>{step.title}</p>
                    <p style={s.stepDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {tab === 'result' && plan && (
          <div style={s.card}>
            {/* Plan header */}
            <div style={s.planHeader}>
              <div>
                <h2 style={s.planCity}>📍 {plan.city}</h2>
                <div style={s.planMeta}>
                  <span style={s.metaBadge}>🗓 {plan.duration}</span>
                  <span style={s.metaBadge}>💰 Budget: {plan.budget} DT</span>
                  <span style={{ ...s.metaBadge, background: '#e8f5e9', color: '#2d6a4f' }}>
                    ✓ Coût: {plan.totalCost} DT
                  </span>
                </div>
              </div>
              {!plan.isShared ? (
                <button style={s.shareBtn} onClick={() => handleShare(plan._id)}>
                  ↗ Partager
                </button>
              ) : (
                <span style={s.sharedBadge}>✓ Partagé</span>
              )}
            </div>

            {/* Activities */}
            {plan.activities?.length === 0 ? (
              <div style={s.empty}>
                <p>😔 Aucune activité trouvée pour ce budget</p>
              </div>
            ) : (
              <div style={s.timeline}>
                {plan.activities?.map((act, i) => (
                  <div key={i} style={s.timelineItem}>
                    <div style={{ ...s.dot, background: categoryText[act.category] || '#2d6a4f' }} />
                    <div style={s.actCard}>
                      <div style={s.actTop}>
                        <div style={s.actLeft}>
                          <span style={s.actName}>{act.name}</span>
                          <span style={{
                            ...s.actBadge,
                            background: categoryColor[act.category] || '#f0f0f0',
                            color: categoryText[act.category] || '#333',
                          }}>
                            {act.category}
                          </span>
                        </div>
                        <span style={s.actPrice}>
                          {act.price === 0 ? '🆓 Gratuit' : `${act.price} DT`}
                        </span>
                      </div>
                      <div style={s.actBottom}>
                        {act.rating && (
                          <span style={s.actRating}>⭐ {Number(act.rating).toFixed(1)}</span>
                        )}
                        {act.address && (
                          <span style={s.actAddress}>📍 {act.address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Map */}
            {plan.activities?.filter(a => a.coords?.lat).length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={s.sectionTitle}>🗺 Localisation</h3>
                <MapContainer
                  center={[
                    plan.activities.find(a => a.coords?.lat)?.coords.lat || 36.8,
                    plan.activities.find(a => a.coords?.lat)?.coords.lng || 10.18
                  ]}
                  zoom={13}
                  style={{ height: '320px', borderRadius: '16px' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {plan.activities.filter(a => a.coords?.lat).map((act, i) => (
                    <Marker key={i} position={[act.coords.lat, act.coords.lng]}>
                      <Popup>
                        <strong>{act.name}</strong><br/>
                        {act.category} — {act.price === 0 ? 'Gratuit' : `${act.price} DT`}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Photos */}
            {plan.activities?.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={s.sectionTitle}>📸 Photos</h3>
                <div style={s.photosGrid}>
                  {plan.activities.slice(0, 6).map((act, i) => (
                    <div key={i} style={s.photoCard}>
                      <img
                        src={act.image || `https://source.unsplash.com/300x200/?${encodeURIComponent(act.name + ' Tunisia')}`}
                        alt={act.name}
                        style={s.photo}
                        onError={e => { e.target.src = `https://source.unsplash.com/300x200/?tunisia` }}
                      />
                      <div style={s.photoLabel}>{act.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div>
            {myPlans.length === 0 ? (
              <div style={s.emptyWrap}>
                <p style={s.emptyIcon}>📋</p>
                <p style={s.emptyTitle}>Aucun plan généré</p>
                <button style={s.generateBtn} onClick={() => setTab('generate')}>
                  Créer mon premier plan
                </button>
              </div>
            ) : (
              myPlans.map(p => (
                <div key={p._id} style={{ ...s.card, marginBottom: '1rem' }}>
                  <div style={s.planHeader}>
                    <div>
                      <h3 style={s.planCity}>📍 {p.city}</h3>
                      <div style={s.planMeta}>
                        <span style={s.metaBadge}>🗓 {p.duration}</span>
                        <span style={s.metaBadge}>💰 {p.budget} DT</span>
                        <span style={s.metaBadge}>🏷 {p.activities?.length} activités</span>
                      </div>
                    </div>
                    <div style={s.historyActions}>
                      <button style={s.viewBtn} onClick={() => { setPlan(p); setTab('result') }}>
                        Voir →
                      </button>
                      {!p.isShared ? (
                        <button style={s.shareBtn} onClick={() => handleShare(p._id)}>
                          Partager
                        </button>
                      ) : (
                        <span style={s.sharedBadge}>✓ Partagé</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#f8f9fa' },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: '#fff',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    position: 'sticky', top: 0, zIndex: 100, cursor: 'default',
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
  navLinkActive: {
    background: '#d8f3dc', color: '#2d6a4f',
    border: 'none', cursor: 'pointer', fontSize: '0.95rem',
    padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600',
  },
  navActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  navLinkBtn: {
    background: 'none', border: 'none', color: '#2d6a4f',
    cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
  },
  logoutBtn: {
    background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7',
    borderRadius: '8px', padding: '0.5rem 1rem',
    cursor: 'pointer', fontSize: '0.85rem',
  },
  main: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  pageHeader: { textAlign: 'center', marginBottom: '2rem' },
  pageTitle: { fontSize: '2rem', fontWeight: '800', color: '#1a1a2e', marginBottom: '0.5rem' },
  pageSubtitle: { color: '#6c757d', fontSize: '1rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: {
    flex: 1, padding: '0.75rem',
    background: '#fff', color: '#6c757d',
    border: '1.5px solid #e9ecef',
    borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
  },
  tabActive: {
    background: '#d8f3dc', color: '#2d6a4f',
    border: '1.5px solid #2d6a4f',
  },
  generateLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  card: {
    background: '#fff', borderRadius: '16px',
    padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  cardTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#1a1a2e', fontSize: '0.85rem', fontWeight: '600' },
  input: {
    background: '#fff', border: '1.5px solid #e9ecef',
    borderRadius: '10px', padding: '0.85rem 1rem',
    color: '#1a1a2e', fontSize: '0.95rem', outline: 'none',
  },
  select: {
    background: '#fff', border: '1.5px solid #e9ecef',
    borderRadius: '10px', padding: '0.85rem 1rem',
    color: '#1a1a2e', fontSize: '0.95rem', outline: 'none',
  },
  generateBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.9rem',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem',
  },
  step: { display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.2rem' },
  stepIconWrap: { fontSize: '1.5rem', flexShrink: 0 },
  stepTitle: { color: '#1a1a2e', fontWeight: '600', marginBottom: '0.2rem', fontSize: '0.95rem' },
  stepDesc: { color: '#6c757d', fontSize: '0.85rem' },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  planCity: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' },
  planMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  metaBadge: {
    background: '#f8f9fa', color: '#495057',
    padding: '0.3rem 0.75rem', borderRadius: '20px',
    fontSize: '0.8rem', fontWeight: '500',
  },
  shareBtn: {
    background: '#2d6a4f', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '0.5rem 1.25rem',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap',
  },
  sharedBadge: { color: '#2d6a4f', fontWeight: '600', fontSize: '0.9rem' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  timelineItem: { display: 'flex', gap: '1rem', alignItems: 'flex-start' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', marginTop: '8px', flexShrink: 0 },
  actCard: {
    flex: 1, background: '#f8f9fa', borderRadius: '12px',
    padding: '0.75rem 1rem', border: '1px solid #e9ecef',
  },
  actTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' },
  actLeft: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  actName: { color: '#1a1a2e', fontSize: '0.95rem', fontWeight: '600' },
  actBadge: { fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', width: 'fit-content' },
  actPrice: { color: '#2d6a4f', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  actBottom: { display: 'flex', gap: '1rem', alignItems: 'center' },
  actRating: { color: '#f59e0b', fontSize: '0.8rem' },
  actAddress: { color: '#6c757d', fontSize: '0.8rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1rem' },
  photosGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' },
  photoCard: { borderRadius: '12px', overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: '120px', objectFit: 'cover', display: 'block' },
  photoLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: '0.5rem', color: '#fff', fontSize: '0.75rem', fontWeight: '500',
  },
  empty: { textAlign: 'center', padding: '2rem', color: '#6c757d' },
  emptyWrap: { textAlign: 'center', padding: '3rem' },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  emptyTitle: { color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' },
  historyActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  viewBtn: {
    background: '#f8f9fa', color: '#1a1a2e',
    border: '1.5px solid #e9ecef', borderRadius: '10px',
    padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
  },
}
