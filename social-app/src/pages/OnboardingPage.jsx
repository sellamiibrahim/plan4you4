import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

const WILAYAS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine','Tataouine','Gafsa','Tozeur','Djerba','Hammamet']

const INTERESTS = [
  { id: 'plage',     label: '🏖 Plage',        desc: 'Mer et natation' },
  { id: 'culture',   label: '🏛 Culture',       desc: 'Histoire et musées' },
  { id: 'food',      label: '🍽 Gastronomie',   desc: 'Restos et cafés' },
  { id: 'nature',    label: '🌿 Nature',         desc: 'Forêts et randonnée' },
  { id: 'shopping',  label: '🛍 Shopping',       desc: 'Marchés et boutiques' },
  { id: 'aventure',  label: '🏕 Aventure',       desc: 'Camping et 4x4' },
  { id: 'famille',   label: '👨‍👩‍👧 Famille',        desc: 'Activités en famille' },
  { id: 'detente',   label: '🧘 Détente',        desc: 'Spas et repos' },
]

const BUDGETS = [
  { id: 'low',    label: '💚 Petit budget',   desc: '0 — 50 DT',    value: 50  },
  { id: 'mid',    label: '💛 Budget moyen',   desc: '50 — 150 DT',  value: 150 },
  { id: 'high',   label: '🧡 Budget confort', desc: '150 — 300 DT', value: 300 },
  { id: 'luxury', label: '💜 Budget luxe',    desc: '300 DT+',      value: 500 },
]

const TRAVEL_STYLES = [
  { id: 'solo',    label: '🧍 Solo',      desc: 'Voyage seul(e)' },
  { id: 'couple',  label: '👫 Couple',    desc: 'En amoureux' },
  { id: 'amis',    label: '👯 Amis',      desc: 'Entre amis' },
  { id: 'famille', label: '👨‍👩‍👧 Famille',   desc: 'En famille' },
]

export default function OnboardingPage() {
  const [step, setStep]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [data, setData]         = useState({
    wilaya:      '',
    interests:   [],
    budget:      '',
    travelStyle: '',
    age:         '',
  })
  const { user } = useAuth()
  const navigate = useNavigate()

  const totalSteps = 4

  const toggleInterest = (id) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }))
  }

  const handleFinish = async () => {
    setLoading(true)
    console.log('user id:', user?._id)
    console.log('data before send:', data)
    try {
      const payload = {
        wilaya:      data.wilaya,
        interests:   data.interests,
        budget:      BUDGETS.find(b => b.id === data.budget)?.value || 200,
        travelStyle: data.travelStyle,
      }
      console.log('payload:', payload)
      const res = await api.patch(`/users/${user?._id}/preferences`, payload)
      console.log('response:', res.data)
      navigate('/')
    } catch (err) {
      console.error('erreur preferences:', err)
      console.error('error response:', err.response?.data)
      console.error('error status:', err.response?.status)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 1) return data.wilaya !== ''
    if (step === 2) return data.interests.length > 0
    if (step === 3) return data.budget !== ''
    if (step === 4) return data.travelStyle !== ''
    return true
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <span>🗺</span>
          <span style={s.logoText}>Win Nemchi <span style={s.logoQ}>?</span></span>
        </div>
        <div style={s.stepIndicator}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{...s.stepDot, ...(n === step ? s.stepDotActive : n < step ? s.stepDotDone : {})}}>
              {n < step ? '✓' : n}
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={s.progressTrack}>
        <div style={{...s.progressFill, width: `${(step/totalSteps)*100}%`}}/>
      </div>

      <div style={s.main}>
        <div style={s.card}>

          {/* ── STEP 1: Wilaya ── */}
          {step === 1 && (
            <div>
              <div style={s.stepHeader}>
                <span style={s.stepEmoji}>📍</span>
                <h2 style={s.stepTitle}>Où habites-tu?</h2>
                <p style={s.stepDesc}>On va personnaliser tes plans selon ta wilaya</p>
              </div>
              <div style={s.wilayaGrid}>
                {WILAYAS.map(w => (
                  <button
                    key={w}
                    style={{...s.wilayaBtn, ...(data.wilaya === w ? s.wilayaBtnActive : {})}}
                    onClick={() => setData({...data, wilaya: w})}
                  >
                    {data.wilaya === w && <span style={s.checkIcon}>✓</span>}
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Interests ── */}
          {step === 2 && (
            <div>
              <div style={s.stepHeader}>
                <span style={s.stepEmoji}>❤️</span>
                <h2 style={s.stepTitle}>Qu'est-ce qui t'intéresse?</h2>
                <p style={s.stepDesc}>Choisis tout ce qui te plaît (plusieurs choix possibles)</p>
              </div>
              <div style={s.interestsGrid}>
                {INTERESTS.map(interest => (
                  <button
                    key={interest.id}
                    style={{...s.interestBtn, ...(data.interests.includes(interest.id) ? s.interestBtnActive : {})}}
                    onClick={() => toggleInterest(interest.id)}
                  >
                    <span style={s.interestEmoji}>{interest.label.split(' ')[0]}</span>
                    <span style={s.interestLabel}>{interest.label.split(' ').slice(1).join(' ')}</span>
                    <span style={s.interestDesc}>{interest.desc}</span>
                    {data.interests.includes(interest.id) && (
                      <div style={s.interestCheck}>✓</div>
                    )}
                  </button>
                ))}
              </div>
              <p style={s.selectedCount}>
                {data.interests.length} sélectionné{data.interests.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* ── STEP 3: Budget ── */}
          {step === 3 && (
            <div>
              <div style={s.stepHeader}>
                <span style={s.stepEmoji}>💰</span>
                <h2 style={s.stepTitle}>Quel est ton budget habituel?</h2>
                <p style={s.stepDesc}>Pour une sortie ou un weekend</p>
              </div>
              <div style={s.budgetGrid}>
                {BUDGETS.map(b => (
                  <button
                    key={b.id}
                    style={{...s.budgetBtn, ...(data.budget === b.id ? s.budgetBtnActive : {})}}
                    onClick={() => setData({...data, budget: b.id})}
                  >
                    <span style={s.budgetLabel}>{b.label}</span>
                    <span style={s.budgetDesc}>{b.desc}</span>
                    {data.budget === b.id && <span style={s.budgetCheck}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Travel Style ── */}
          {step === 4 && (
            <div>
              <div style={s.stepHeader}>
                <span style={s.stepEmoji}>✈️</span>
                <h2 style={s.stepTitle}>Comment voyages-tu?</h2>
                <p style={s.stepDesc}>Ça nous aide à adapter nos recommandations</p>
              </div>
              <div style={s.travelGrid}>
                {TRAVEL_STYLES.map(t => (
                  <button
                    key={t.id}
                    style={{...s.travelBtn, ...(data.travelStyle === t.id ? s.travelBtnActive : {})}}
                    onClick={() => setData({...data, travelStyle: t.id})}
                  >
                    <span style={s.travelEmoji}>{t.label.split(' ')[0]}</span>
                    <span style={s.travelLabel}>{t.label.split(' ').slice(1).join(' ')}</span>
                    <span style={s.travelDesc}>{t.desc}</span>
                    {data.travelStyle === t.id && <span style={s.travelCheck}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Summary */}
              {data.wilaya && data.interests.length > 0 && data.budget && (
                <div style={s.summary}>
                  <h4 style={s.summaryTitle}>🎯 Ton profil</h4>
                  <div style={s.summaryItems}>
                    <div style={s.summaryItem}>
                      <span style={s.summaryIcon}>📍</span>
                      <span style={s.summaryText}>{data.wilaya}</span>
                    </div>
                    <div style={s.summaryItem}>
                      <span style={s.summaryIcon}>❤️</span>
                      <span style={s.summaryText}>{data.interests.length} intérêts</span>
                    </div>
                    <div style={s.summaryItem}>
                      <span style={s.summaryIcon}>💰</span>
                      <span style={s.summaryText}>{BUDGETS.find(b=>b.id===data.budget)?.desc}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={s.navBtns}>
            {step > 1 && (
              <button style={s.prevBtn} onClick={() => setStep(s => s - 1)}>
                ← Précédent
              </button>
            )}
            {step < 4 ? (
              <button
                style={{...s.nextBtn, opacity: canNext() ? 1 : 0.5}}
                onClick={() => canNext() && setStep(s => s + 1)}
                disabled={!canNext()}
              >
                Suivant →
              </button>
            ) : (
              <button
                style={{...s.finishBtn, opacity: canNext() && !loading ? 1 : 0.7}}
                onClick={canNext() && !loading ? handleFinish : undefined}
                disabled={!canNext() || loading}
              >
                {loading ? '⏳ Sauvegarde...' : '✨ Commencer l\'aventure!'}
              </button>
            )}
          </div>

          {/* Skip */}
          <button style={s.skipBtn} onClick={() => navigate('/')}>
            Passer cette étape →
          </button>

        </div>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight:'100vh', background:'#f8f9fa' },

  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 2rem', background:'#fff', boxShadow:'0 1px 8px rgba(0,0,0,0.06)' },
  logo:    { display:'flex', alignItems:'center', gap:'0.5rem' },
  logoText:{ fontSize:'1.2rem', fontWeight:'700', color:'#2d6a4f' },
  logoQ:   { color:'#52b788' },

  stepIndicator: { display:'flex', gap:'0.5rem', alignItems:'center' },
  stepDot:       { width:'32px', height:'32px', borderRadius:'50%', background:'#f0f0f0', color:'#adb5bd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:'600' },
  stepDotActive: { background:'#2d6a4f', color:'#fff' },
  stepDotDone:   { background:'#d8f3dc', color:'#2d6a4f' },

  progressTrack: { height:'4px', background:'#f0f0f0' },
  progressFill:  { height:'100%', background:'linear-gradient(90deg, #2d6a4f, #52b788)', transition:'width 0.4s ease', borderRadius:'2px' },

  main: { maxWidth:'700px', margin:'2rem auto', padding:'0 1rem' },
  card: { background:'#fff', borderRadius:'20px', padding:'2rem', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' },

  stepHeader: { textAlign:'center', marginBottom:'2rem' },
  stepEmoji:  { fontSize:'3rem', display:'block', marginBottom:'0.75rem' },
  stepTitle:  { fontSize:'1.6rem', fontWeight:'700', color:'#1a1a2e', marginBottom:'0.5rem' },
  stepDesc:   { color:'#6c757d', fontSize:'0.95rem' },

  // Wilaya grid
  wilayaGrid:      { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.5rem', maxHeight:'320px', overflowY:'auto', padding:'0.25rem' },
  wilayaBtn:       { padding:'0.6rem 0.5rem', border:'1.5px solid #e9ecef', borderRadius:'10px', background:'#fff', color:'#495057', cursor:'pointer', fontSize:'0.82rem', fontWeight:'500', position:'relative', textAlign:'center' },
  wilayaBtnActive: { border:'1.5px solid #2d6a4f', background:'#d8f3dc', color:'#2d6a4f', fontWeight:'600' },
  checkIcon:       { position:'absolute', top:'4px', right:'6px', fontSize:'0.7rem', color:'#2d6a4f' },

  // Interests grid
  interestsGrid:      { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem' },
  interestBtn:        { padding:'1rem', border:'1.5px solid #e9ecef', borderRadius:'14px', background:'#fff', cursor:'pointer', textAlign:'left', position:'relative', display:'flex', flexDirection:'column', gap:'0.2rem' },
  interestBtnActive:  { border:'1.5px solid #2d6a4f', background:'#d8f3dc' },
  interestEmoji:      { fontSize:'1.5rem', display:'block' },
  interestLabel:      { fontSize:'0.95rem', fontWeight:'600', color:'#1a1a2e' },
  interestDesc:       { fontSize:'0.8rem', color:'#6c757d' },
  interestCheck:      { position:'absolute', top:'10px', right:'10px', width:'22px', height:'22px', borderRadius:'50%', background:'#2d6a4f', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:'700' },
  selectedCount:      { color:'#2d6a4f', fontSize:'0.85rem', textAlign:'center', marginTop:'1rem', fontWeight:'500' },

  // Budget grid
  budgetGrid:      { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem' },
  budgetBtn:       { padding:'1.25rem', border:'1.5px solid #e9ecef', borderRadius:'14px', background:'#fff', cursor:'pointer', textAlign:'left', position:'relative', display:'flex', flexDirection:'column', gap:'0.3rem' },
  budgetBtnActive: { border:'1.5px solid #2d6a4f', background:'#d8f3dc' },
  budgetLabel:     { fontSize:'1rem', fontWeight:'600', color:'#1a1a2e' },
  budgetDesc:      { fontSize:'0.85rem', color:'#6c757d' },
  budgetCheck:     { position:'absolute', top:'12px', right:'12px', color:'#2d6a4f', fontWeight:'700', fontSize:'1.1rem' },

  // Travel style grid
  travelGrid:      { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' },
  travelBtn:       { padding:'1.25rem', border:'1.5px solid #e9ecef', borderRadius:'14px', background:'#fff', cursor:'pointer', textAlign:'left', position:'relative', display:'flex', flexDirection:'column', gap:'0.3rem' },
  travelBtnActive: { border:'1.5px solid #2d6a4f', background:'#d8f3dc' },
  travelEmoji:     { fontSize:'1.8rem', display:'block' },
  travelLabel:     { fontSize:'1rem', fontWeight:'600', color:'#1a1a2e' },
  travelDesc:      { fontSize:'0.85rem', color:'#6c757d' },
  travelCheck:     { position:'absolute', top:'12px', right:'12px', color:'#2d6a4f', fontWeight:'700', fontSize:'1.1rem' },

  // Summary
  summary:      { background:'#f8f9fa', borderRadius:'14px', padding:'1rem 1.25rem', border:'1px solid #e9ecef' },
  summaryTitle: { fontSize:'0.95rem', fontWeight:'700', color:'#1a1a2e', marginBottom:'0.75rem' },
  summaryItems: { display:'flex', gap:'1.5rem' },
  summaryItem:  { display:'flex', alignItems:'center', gap:'0.4rem' },
  summaryIcon:  { fontSize:'1rem' },
  summaryText:  { fontSize:'0.85rem', color:'#495057', fontWeight:'500' },

  // Navigation
  navBtns:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'2rem', gap:'1rem' },
  prevBtn:  { background:'#f8f9fa', color:'#6c757d', border:'1.5px solid #e9ecef', borderRadius:'10px', padding:'0.75rem 1.5rem', cursor:'pointer', fontSize:'0.95rem' },
  nextBtn:  { background:'#2d6a4f', color:'#fff', border:'none', borderRadius:'10px', padding:'0.75rem 2rem', cursor:'pointer', fontSize:'0.95rem', fontWeight:'600', marginLeft:'auto' },
  finishBtn:{ background:'linear-gradient(135deg, #2d6a4f, #52b788)', color:'#fff', border:'none', borderRadius:'10px', padding:'0.85rem 2rem', cursor:'pointer', fontSize:'1rem', fontWeight:'700', marginLeft:'auto' },
  skipBtn:  { display:'block', width:'100%', textAlign:'center', marginTop:'1rem', background:'none', border:'none', color:'#adb5bd', cursor:'pointer', fontSize:'0.85rem' },
}
