import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const categoryBg  = { restaurant:'#e8f5e9', café:'#fff8e1', activité:'#e3f2fd', hébergement:'#fce4ec', transport:'#ede7f6' }
const categoryTxt = { restaurant:'#2d6a4f', café:'#f59e0b', activité:'#1565c0', hébergement:'#c2185b', transport:'#6a1b9a' }

const amenitiesByCategory = {
  restaurant:  [{icon:'🍽',label:'Service table'},{icon:'📶',label:'Wi-Fi'},{icon:'🅿',label:'Parking'},{icon:'❄️',label:'Climatisé'}],
  café:        [{icon:'📶',label:'Wi-Fi gratuit'},{icon:'🔌',label:'Prises'},{icon:'🎵',label:'Musique'},{icon:'🪑',label:'Terrasse'}],
  activité:    [{icon:'🎟',label:'Entrée'},{icon:'📸',label:'Photos OK'},{icon:'♿',label:'Accessible'},{icon:'🅿',label:'Parking'}],
  hébergement: [{icon:'📶',label:'Wi-Fi'},{icon:'🅿',label:'Parking'},{icon:'🏊',label:'Piscine'},{icon:'🍳',label:'Petit-déj'}],
  transport:   [{icon:'🕐',label:'24h/24'},{icon:'💳',label:'Carte OK'},{icon:'📱',label:'App dispo'},{icon:'⭐',label:'Noté'}],
}

const MOCK_REVIEWS = [
  {user:'Ali B.',    avatar:'A', rating:5, text:'Endroit magnifique, personnel très accueillant!',    date:'3 jours',   color:'#2d6a4f'},
  {user:'Sami K.',   avatar:'S', rating:4, text:'Très bon rapport qualité/prix, je recommande.',      date:'1 semaine',  color:'#1565c0'},
  {user:'Rania M.',  avatar:'R', rating:4, text:'Bonne expérience, reviendrai sûrement.',              date:'2 semaines', color:'#c2185b'},
  {user:'Karim T.',  avatar:'K', rating:5, text:'Incontournable lors de votre passage dans la région!', date:'1 mois',  color:'#f59e0b'},
]

const RATING_DIST = [
  {stars:5, count:80},
  {stars:4, count:45},
  {stars:3, count:12},
  {stars:2, count:5},
  {stars:1, count:3},
]
const TOTAL_REVIEWS = RATING_DIST.reduce((s,r)=>s+r.count,0)

const generateMockPlace = (id) => {
  const places = [
    // Tunis
    { _id: '1', name: 'Café Central Tunis', category: 'café', wilaya: 'Tunis', address: 'Avenue Habib Bourguiba', price: 15, rating: 4.5, description: 'Un café traditionnel au cœur de Tunis avec une excellente ambiance.', tags: ['traditionnel', 'centre-ville', 'wifi'], coords: { lat: 36.8065, lng: 10.1815 } },
    { _id: '2', name: 'Restaurant Dar El Medina', category: 'restaurant', wilaya: 'Tunis', address: 'Medina, Tunis', price: 60, rating: 4.7, description: 'Cuisine tunisienne authentique dans une belle riad historique.', tags: ['cuisine tunisienne', 'médina'], coords: { lat: 36.7982, lng: 10.1689 } },
    { _id: '3', name: 'Musée du Bardo', category: 'activité', wilaya: 'Tunis', address: 'Route du Bardo', price: 30, rating: 4.8, description: 'Le plus grand musée d\'Afrique du Nord avec mosaïques romaines.', tags: ['musée', 'histoire'], coords: { lat: 36.8062, lng: 10.1598 } },
    { _id: '4', name: 'Hotel Mövenpick', category: 'hébergement', wilaya: 'Tunis', address: 'Avenue Mohammed V', price: 250, rating: 4.6, description: 'Hôtel 5 étoiles moderne avec vue sur le lac.', tags: ['luxe', 'piscine'], coords: { lat: 36.8432, lng: 10.1961 } },

    // Sousse
    { _id: '5', name: 'Café de la Plage', category: 'café', wilaya: 'Sousse', address: 'Corniche Sousse', price: 12, rating: 4.3, description: 'Café face à la mer avec vue panoramique magnifique.', tags: ['bord de mer', 'plage'], coords: { lat: 35.8245, lng: 10.6369 } },
    { _id: '6', name: 'Restaurant Corail', category: 'restaurant', wilaya: 'Sousse', address: 'Port de Sousse', price: 50, rating: 4.5, description: 'Restaurant de fruits de mer frais en bord de port.', tags: ['fruits de mer', 'port'], coords: { lat: 35.8285, lng: 10.6412 } },
    { _id: '7', name: 'Médina Sousse', category: 'activité', wilaya: 'Sousse', address: 'Médina historique', price: 8, rating: 4.4, description: 'Visite guidée de la médina historique avec souks authentiques.', tags: ['histoire', 'souk'], coords: { lat: 35.8242, lng: 10.6348 } },
    { _id: '8', name: 'Hôtel Sousse Palace', category: 'hébergement', wilaya: 'Sousse', address: 'Plage Bourguiba', price: 150, rating: 4.2, description: 'Hôtel all-inclusive avec accès direct à la plage.', tags: ['all-inclusive', 'plage'], coords: { lat: 35.8334, lng: 10.6421 } },

    // Sfax
    { _id: '9', name: 'Café Sfaxien', category: 'café', wilaya: 'Sfax', address: 'Avenue Bourguiba, Sfax', price: 10, rating: 4.1, description: 'Café traditionnel avec ambiance local authentique.', tags: ['traditionnel', 'local'], coords: { lat: 34.7406, lng: 10.7605 } },
    { _id: '10', name: 'Restaurant Thyna', category: 'restaurant', wilaya: 'Sfax', address: 'Zone Touristique', price: 45, rating: 4.4, description: 'Cuisine méditerranéenne moderne dans cadre élégant.', tags: ['méditerranéen', 'moderne'], coords: { lat: 34.7432, lng: 10.7548 } },
    { _id: '11', name: 'Îles Kerkennah', category: 'activité', wilaya: 'Sfax', address: 'Ferry vers Kerkennah', price: 25, rating: 4.6, description: 'Excursion aux îles avec plages paradisiaques et pêche traditionnelle.', tags: ['îles', 'plage', 'pêche'], coords: { lat: 34.6847, lng: 11.2647 } },

    // Djerba
    { _id: '12', name: 'Café Djerbien', category: 'café', wilaya: 'Djerba', address: 'Zone Touristique', price: 14, rating: 4.2, description: 'Café avec terrasse panoramique sur les plages.', tags: ['terrasse', 'plage'], coords: { lat: 33.8255, lng: 10.9500 } },
    { _id: '13', name: 'Restaurant Ennajma', category: 'restaurant', wilaya: 'Djerba', address: 'Skhira', price: 55, rating: 4.7, description: 'Restaurant gastronomique réputé pour ses fruits de mer.', tags: ['gastronomie', 'fruits de mer'], coords: { lat: 33.8213, lng: 10.9456 } },
    { _id: '14', name: 'Parc Explor Djerba', category: 'activité', wilaya: 'Djerba', address: 'Zone Touristique', price: 35, rating: 4.5, description: 'Parc d\'attractions avec attractions pour toute la famille.', tags: ['famille', 'parc'], coords: { lat: 33.8300, lng: 10.9600 } },
    { _id: '15', name: 'Hôtel Seabel Aladin', category: 'hébergement', wilaya: 'Djerba', address: 'Plage Aghir', price: 180, rating: 4.4, description: 'Resort 4 étoiles all-inclusive avec animations.', tags: ['all-inclusive', 'plage'], coords: { lat: 33.8340, lng: 10.9720 } },

    // Hammamet
    { _id: '16', name: 'Café Palmyre', category: 'café', wilaya: 'Hammamet', address: 'Medina Hammamet', price: 11, rating: 4.0, description: 'Café authentique dans la médina avec ambiance traditionnelle.', tags: ['médina', 'traditionnel'], coords: { lat: 36.3918, lng: 10.6169 } },
    { _id: '17', name: 'Restaurant Le Barberousse', category: 'restaurant', wilaya: 'Hammamet', address: 'Corniche Hammamet', price: 65, rating: 4.6, description: 'Restaurant haut de gamme avec vue mer spectaculaire.', tags: ['vue mer', 'haut de gamme'], coords: { lat: 36.3977, lng: 10.6138 } },
    { _id: '18', name: 'Kasbah Hammamet', category: 'activité', wilaya: 'Hammamet', address: 'Medina Hammamet', price: 15, rating: 4.5, description: 'Visite historique de la kasbah avec vue panoramique.', tags: ['histoire', 'kasbah'], coords: { lat: 36.3895, lng: 10.6157 } },

    // Nabeul
    { _id: '19', name: 'Café Poterie', category: 'café', wilaya: 'Nabeul', address: 'Centre Nabeul', price: 9, rating: 4.2, description: 'Café artisanal avec poteries locales à vendre.', tags: ['artisanat', 'local'], coords: { lat: 36.4578, lng: 10.7371 } },
    { _id: '20', name: 'Restaurant Jasmin', category: 'restaurant', wilaya: 'Nabeul', address: 'Avenue Bourguiba', price: 40, rating: 4.3, description: 'Cuisine tunisienne traditionnelle avec spécialités de Nabeul.', tags: ['tunisien', 'spécialités'], coords: { lat: 36.4615, lng: 10.7402 } },
    { _id: '21', name: 'Marché de Nabeul', category: 'activité', wilaya: 'Nabeul', address: 'Souk Central', price: 0, rating: 4.4, description: 'Marché coloré avec céramiques, souvenirs et produits locaux.', tags: ['marché', 'souvenir'], coords: { lat: 36.4545, lng: 10.7345 } },

    // Kasserine
    { _id: '22', name: 'Café de la Montagne', category: 'café', wilaya: 'Kasserine', address: 'Sbeitla', price: 8, rating: 4.0, description: 'Café avec vue sur les montagnes du Dorsal.', tags: ['montagne', 'vue'], coords: { lat: 35.1872, lng: 9.4939 } },
    { _id: '23', name: 'Ruines de Sbeitla', category: 'activité', wilaya: 'Kasserine', address: 'Sbeitla', price: 20, rating: 4.6, description: 'Site archéologique romain avec temples et thermes bien conservés.', tags: ['archéologie', 'histoire'], coords: { lat: 35.1864, lng: 9.4956 } },

    // Tataouine
    { _id: '24', name: 'Café Tataouinois', category: 'café', wilaya: 'Tataouine', address: 'Medina', price: 7, rating: 4.1, description: 'Café berber traditionnel dans la médina.', tags: ['berber', 'traditionnel'], coords: { lat: 32.9256, lng: 10.4549 } },
    { _id: '25', name: 'Tataouine Expérience', category: 'activité', wilaya: 'Tataouine', address: 'Tataouine', price: 40, rating: 4.5, description: 'Visite des casbahs et villages berbères authentiques.', tags: ['berbère', 'culture'], coords: { lat: 32.9280, lng: 10.4569 } },
  ]
  return places.find(p => p._id === id) || places[0]
}

export default function PlaceDetailsPage() {
  const [place, setPlace]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [liked, setLiked]         = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [review, setReview]       = useState({rating:5, text:''})
  const [submitted, setSubmitted] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const { id }     = useParams()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const res = await api.get(`/places/${id}`)
        setPlace(res.data)
      } catch (err) {
        console.error('API error, using fallback data:', err)
        // Fallback: generate mock place data
        const mockPlace = generateMockPlace(id)
        setPlace(mockPlace)
      } finally {
        setLoading(false)
      }
    }

    fetchPlace()
  }, [id])

  const handleSubmitReview = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setShowReview(false)
  }

  const handleImageUpload = (imageData) => {
    setUploadedPhotos(prev => [...prev, imageData])
  }

  const removeUploadedPhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) return (
    <div style={s.loadingWrap}>
      <div style={s.spinner}/>
      <p style={{color:'#6c757d',marginTop:'1rem'}}>Chargement...</p>
    </div>
  )

  if (!place) return (
    <div style={s.loadingWrap}>
      <p style={{fontSize:'3rem'}}>😕</p>
      <p style={{color:'#6c757d',margin:'1rem 0'}}>Place non trouvée</p>
      <button style={s.primaryBtn} onClick={()=>navigate(-1)}>← Retour</button>
    </div>
  )

  const defaultImages = [
    place.image || `https://source.unsplash.com/700x400/?${encodeURIComponent(place.name+' Tunisia')}`,
    `https://source.unsplash.com/700x400/?tunisia,${place.category}`,
    `https://source.unsplash.com/700x400/?tunisia,food`,
    `https://source.unsplash.com/700x400/?tunisia,travel`,
  ]

  const images = [...uploadedPhotos.map(p => p.url), ...defaultImages]

  const amenities = amenitiesByCategory[place.category] || amenitiesByCategory['activité']

  return (
    <div style={s.page}>

      {/* ── NAVBAR ── */}
      <nav style={s.navbar}>
        <div style={s.navLogo} onClick={()=>navigate('/')}>
          <span style={{fontSize:'1.2rem'}}>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <div style={s.navLinks}>
          <button style={s.navLink} onClick={()=>navigate('/')}>Home</button>
          <button style={s.navLink} onClick={()=>navigate(-1)}>Places</button>
          <button style={s.navLink} onClick={()=>navigate('/plan')}>Plans</button>
        </div>
        <div style={s.navRight}>
          <button
            style={{...s.iconBtn, color: liked ? '#e53e3e':'undefined'}}
            onClick={()=>setLiked(!liked)}
          >
            {liked ? '❤️' : '🤍'}
          </button>
          <button style={s.iconBtn} onClick={()=>navigate(`/profile/${user?._id}`)}>👤</button>
        </div>
      </nav>

      {/* ── BREADCRUMB ── */}
      <div style={s.breadcrumb}>
        <span style={s.breadLink} onClick={()=>navigate('/')}>Home</span>
        <span style={s.breadSep}>›</span>
        <span style={s.breadLink} onClick={()=>navigate(-1)}>Places</span>
        <span style={s.breadSep}>›</span>
        <span style={s.breadCurrent}>{place.name}</span>
      </div>

      <div style={s.main}>

        {/* ══ LEFT ══ */}
        <div style={s.left}>

          {/* Images Gallery */}
          <div style={s.galleryWrap}>
            <div style={s.mainImgWrap}>
              <img
                src={images[activeImg]}
                alt={place.name}
                style={s.mainImg}
                onError={e=>{e.target.src='https://source.unsplash.com/700x400/?tunisia'}}
              />
              <span style={{
                ...s.categoryTag,
                background: categoryBg[place.category]||'#f0f0f0',
                color: categoryTxt[place.category]||'#333',
              }}>
                {place.category}
              </span>
              {/* Nav arrows */}
              <button style={{...s.imgNav, left:'12px'}} onClick={()=>setActiveImg(i=>i===0?images.length-1:i-1)}>‹</button>
              <button style={{...s.imgNav, right:'12px'}} onClick={()=>setActiveImg(i=>i===images.length-1?0:i+1)}>›</button>
            </div>
            <div style={s.thumbsRow}>
              {images.map((img,i)=>(
                <div key={i} style={{...s.thumbWrap,...(activeImg===i?s.thumbActive:{})}} onClick={()=>setActiveImg(i)}>
                  <img
                    src={img} alt=""
                    style={s.thumb}
                    onError={e=>{e.target.src='https://source.unsplash.com/100x80/?tunisia'}}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div style={s.card}>
            <div style={s.placeHeader}>
              <div style={{flex:1}}>
                <h1 style={s.placeName}>{place.name}</h1>
                <div style={s.placeMeta}>
                  <span style={s.metaItem}>📍 {place.address||place.wilaya}, Tunisie</span>
                  <span style={s.metaItem}>🏷 {place.category}</span>
                </div>
              </div>
              <div style={s.ratingBadge}>
                <span style={s.ratingBadgeNum}>⭐ {Number(place.rating).toFixed(1)}</span>
                <span style={s.ratingBadgeSub}>{TOTAL_REVIEWS} avis</span>
              </div>
            </div>

            <p style={s.placeDesc}>
              {place.description || `${place.name} est un${place.category==='activité'?'e':''} ${place.category} situé(e) à ${place.wilaya}. Un endroit incontournable à visiter lors de votre passage dans la région.`}
            </p>

            {/* Tags */}
            <div style={s.tagsRow}>
              {(place.tags||[place.wilaya, place.category]).map((tag,i)=>(
                <span key={i} style={s.tag}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>📸 Partager vos photos</h3>
            <div style={s.uploadArea}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  files.forEach(file => {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      handleImageUpload({ url: event.target.result })
                    }
                    reader.readAsDataURL(file)
                  })
                }}
                style={{ display: 'none' }}
                id="photoInput"
              />
              <button
                style={s.uploadBtn}
                onClick={() => document.getElementById('photoInput').click()}
              >
                📸 Ajouter des photos
              </button>
              <p style={s.uploadHint}>JPG, PNG ou WebP</p>
            </div>

            {/* Uploaded Photos Gallery */}
            {uploadedPhotos.length > 0 && (
              <div style={s.uploadedPhotosSection}>
                <h4 style={s.uploadedPhotosTitle}>Vos photos ({uploadedPhotos.length})</h4>
                <div style={s.uploadedPhotosGrid}>
                  {uploadedPhotos.map((photo, idx) => (
                    <div key={idx} style={s.uploadedPhotoCard}>
                      <img
                        src={photo.url}
                        alt={`Photo ${idx + 1}`}
                        style={s.uploadedPhoto}
                      />
                      <button
                        style={s.deletePhotoBtn}
                        onClick={() => removeUploadedPhoto(idx)}
                        title="Supprimer cette photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Équipements et services</h3>
            <div style={s.amenitiesGrid}>
              {amenities.map((a,i)=>(
                <div key={i} style={s.amenity}>
                  <span style={s.amenityIcon}>{a.icon}</span>
                  <span style={s.amenityText}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          {place.coords?.lat && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Localisation sur la carte</h3>
              <MapContainer
                center={[place.coords.lat, place.coords.lng]}
                zoom={15}
                style={{height:'280px', borderRadius:'12px'}}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap"/>
                <Marker position={[place.coords.lat, place.coords.lng]}>
                  <Popup>
                    <strong>{place.name}</strong><br/>
                    📍 {place.wilaya}
                  </Popup>
                </Marker>
              </MapContainer>
              <div style={s.mapActions}>
                <a
                  href={`https://www.google.com/maps?q=${place.coords.lat},${place.coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.mapLink}
                >
                  🗺 Ouvrir dans Google Maps
                </a>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.coords.lat}&mlon=${place.coords.lng}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.mapLink}
                >
                  🌍 OpenStreetMap
                </a>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div style={s.card}>
            <div style={s.reviewsHeader}>
              <h3 style={s.cardTitle}>Avis des visiteurs</h3>
              <button style={s.addReviewBtn} onClick={()=>setShowReview(!showReview)}>
                ✍️ Ajouter un avis
              </button>
            </div>

            {/* Add review form */}
            {showReview && (
              <div style={s.reviewForm}>
                <h4 style={s.reviewFormTitle}>Votre avis sur {place.name}</h4>
                <div style={s.starsInput}>
                  {[1,2,3,4,5].map(n=>(
                    <button
                      key={n}
                      style={{...s.starBtn, color: n<=review.rating?'#f59e0b':'#ddd'}}
                      onClick={()=>setReview({...review, rating:n})}
                    >★</button>
                  ))}
                  <span style={s.starLabel}>{review.rating}/5</span>
                </div>
                <textarea
                  style={s.reviewTextarea}
                  placeholder="Partagez votre expérience..."
                  value={review.text}
                  onChange={e=>setReview({...review, text:e.target.value})}
                  rows={4}
                />
                <div style={s.reviewFormBtns}>
                  <button style={s.cancelBtn} onClick={()=>setShowReview(false)}>Annuler</button>
                  <button style={s.submitBtn} onClick={handleSubmitReview}>Soumettre</button>
                </div>
              </div>
            )}

            {/* Success message */}
            {submitted && (
              <div style={s.successMsg}>
                ✅ Merci pour votre avis! Il sera publié après modération.
              </div>
            )}

            {/* Reviews list */}
            <div style={s.reviewsList}>
              {MOCK_REVIEWS.map((r,i)=>(
                <div key={i} style={s.reviewCard}>
                  <div style={s.reviewTop}>
                    <div style={{...s.reviewAvatar, background: r.color}}>
                      {r.avatar}
                    </div>
                    <div style={{flex:1}}>
                      <div style={s.reviewMeta}>
                        <span style={s.reviewUser}>{r.user}</span>
                        <span style={s.reviewDate}>il y a {r.date}</span>
                      </div>
                      <div style={s.reviewStars}>
                        {'⭐'.repeat(r.rating)}
                        <span style={s.reviewRatingNum}>{r.rating}.0</span>
                      </div>
                    </div>
                  </div>
                  <p style={s.reviewText}>{r.text}</p>
                  <div style={s.reviewActions}>
                    <button style={s.reviewActionBtn}>👍 Utile</button>
                    <button style={s.reviewActionBtn}>💬 Répondre</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div style={s.right}>

          {/* Price & CTA Card */}
          <div style={s.card}>
            <div style={s.priceSection}>
              <span style={s.priceLabelBig}>Prix estimé</span>
              <span style={s.priceValueBig}>
                {place.price===0 ? '🆓 Gratuit' : `${place.price} DT`}
              </span>
            </div>

            <button style={s.primaryBtn} onClick={()=>navigate('/plan')}>
              ✨ Générer un plan incluant ce lieu
            </button>
            <button style={s.secondaryBtn} onClick={()=>setShowReview(true)}>
              ✍️ Écrire un avis
            </button>
            <button style={s.ghostBtn} onClick={()=>navigate(-1)}>
              ← Retour aux résultats
            </button>
          </div>

          {/* Rating Summary */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Note globale</h3>
            <div style={s.ratingBig}>
              <span style={s.ratingBigNum}>{Number(place.rating).toFixed(1)}</span>
              <div>
                <div style={s.starsRowBig}>{'⭐'.repeat(Math.floor(place.rating))}</div>
                <p style={s.ratingSubText}>sur 5 — {TOTAL_REVIEWS} avis</p>
              </div>
            </div>

            {RATING_DIST.map((r,i)=>(
              <div key={i} style={s.ratingBar}>
                <span style={s.ratingBarLabel}>{r.stars} ⭐</span>
                <div style={s.barTrack}>
                  <div style={{
                    ...s.barFill,
                    width:`${(r.count/TOTAL_REVIEWS)*100}%`,
                    background: r.stars>=4?'#2d6a4f':r.stars===3?'#f59e0b':'#e53e3e'
                  }}/>
                </div>
                <span style={s.ratingBarCount}>{r.count}</span>
              </div>
            ))}
          </div>

          {/* Place Info */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Informations</h3>
            <div style={s.infoList}>
              <div style={s.infoItem}>
                <span style={s.infoIcon}>📍</span>
                <div>
                  <p style={s.infoLabel}>Localisation</p>
                  <p style={s.infoValue}>{place.wilaya}, Tunisie</p>
                </div>
              </div>
              {place.address && (
                <div style={s.infoItem}>
                  <span style={s.infoIcon}>🏠</span>
                  <div>
                    <p style={s.infoLabel}>Adresse</p>
                    <p style={s.infoValue}>{place.address}</p>
                  </div>
                </div>
              )}
              <div style={s.infoItem}>
                <span style={s.infoIcon}>🏷</span>
                <div>
                  <p style={s.infoLabel}>Catégorie</p>
                  <p style={{...s.infoValue, color: categoryTxt[place.category]||'#333', fontWeight:'600'}}>
                    {place.category}
                  </p>
                </div>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoIcon}>💰</span>
                <div>
                  <p style={s.infoLabel}>Prix</p>
                  <p style={s.infoValue}>{place.price===0?'Gratuit':`${place.price} DT`}</p>
                </div>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoIcon}>⭐</span>
                <div>
                  <p style={s.infoLabel}>Note</p>
                  <p style={s.infoValue}>{Number(place.rating).toFixed(1)} / 5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Similar places suggestion */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Places similaires</h3>
            <p style={s.similarDesc}>Découvrez d'autres {place.category}s à {place.wilaya}</p>
            <button
              style={s.secondaryBtn}
              onClick={()=>navigate(`/results?city=${place.wilaya}&type=${place.category}&budget=500`)}
            >
              🔍 Voir plus de {place.category}s
            </button>
          </div>

        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <span>🗺</span>
          <span style={s.logoText}>plan4you</span>
        </div>
        <p style={s.footerText}>© 2026 plan4you — Tous droits réservés</p>
      </footer>
    </div>
  )
}

const s = {
  page:        { minHeight:'100vh', background:'#f8f9fa' },
  loadingWrap: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  spinner:     { width:'40px', height:'40px', border:'4px solid #e9ecef', borderTop:'4px solid #2d6a4f', borderRadius:'50%' },

  /* Navbar */
  navbar:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 2rem', background:'#fff', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', position:'sticky', top:0, zIndex:100 },
  navLogo:   { display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  logoText:  { fontSize:'1.2rem', fontWeight:'700', color:'#2d6a4f' },
  logoQ:     { color:'#52b788' },
  navLinks:  { display:'flex', gap:'0.25rem' },
  navLink:   { background:'none', border:'none', color:'#6c757d', cursor:'pointer', fontSize:'0.9rem', padding:'0.5rem 1rem', borderRadius:'8px' },
  navRight:  { display:'flex', gap:'0.5rem' },
  iconBtn:   { background:'none', border:'1.5px solid #e9ecef', borderRadius:'8px', padding:'0.5rem 0.75rem', cursor:'pointer', fontSize:'1rem' },

  /* Breadcrumb */
  breadcrumb:   { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem 2rem', background:'#fff', borderBottom:'1px solid #f0f0f0', fontSize:'0.85rem' },
  breadLink:    { color:'#2d6a4f', cursor:'pointer', fontWeight:'500' },
  breadSep:     { color:'#adb5bd' },
  breadCurrent: { color:'#495057' },

  /* Layout */
  main:  { maxWidth:'1200px', margin:'2rem auto', padding:'0 2rem', display:'grid', gridTemplateColumns:'1fr 320px', gap:'2rem' },
  left:  {},
  right: { display:'flex', flexDirection:'column', gap:'1.25rem', position:'sticky', top:'80px', height:'fit-content' },

  /* Cards */
  card:      { background:'#fff', borderRadius:'16px', padding:'1.5rem', marginBottom:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize:'1rem', fontWeight:'700', color:'#1a1a2e', marginBottom:'1rem' },

  /* Gallery */
  galleryWrap:  { marginBottom:'1.5rem' },
  mainImgWrap:  { position:'relative', marginBottom:'0.75rem' },
  mainImg:      { width:'100%', height:'380px', objectFit:'cover', borderRadius:'16px', display:'block' },
  categoryTag:  { position:'absolute', top:'1rem', left:'1rem', padding:'0.3rem 0.9rem', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600' },
  imgNav:       { position:'absolute', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.9)', border:'none', borderRadius:'50%', width:'36px', height:'36px', cursor:'pointer', fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' },
  thumbsRow:    { display:'flex', gap:'0.5rem' },
  thumbWrap:    { flex:1, borderRadius:'10px', overflow:'hidden', cursor:'pointer', border:'2px solid transparent', opacity:0.7, transition:'all 0.2s' },
  thumbActive:  { border:'2px solid #2d6a4f', opacity:1 },
  thumb:        { width:'100%', height:'72px', objectFit:'cover', display:'block' },

  /* Place header */
  placeHeader:    { display:'flex', gap:'1rem', alignItems:'flex-start', marginBottom:'1rem' },
  placeName:      { fontSize:'1.6rem', fontWeight:'700', color:'#1a1a2e', marginBottom:'0.5rem' },
  placeMeta:      { display:'flex', gap:'1rem', flexWrap:'wrap' },
  metaItem:       { color:'#6c757d', fontSize:'0.85rem' },
  ratingBadge:    { background:'#fff8e1', borderRadius:'12px', padding:'0.6rem 1rem', textAlign:'center', flexShrink:0 },
  ratingBadgeNum: { color:'#f59e0b', fontWeight:'700', fontSize:'1.1rem', display:'block' },
  ratingBadgeSub: { color:'#6c757d', fontSize:'0.75rem', display:'block' },
  placeDesc:      { color:'#495057', lineHeight:'1.7', fontSize:'0.95rem', marginBottom:'1rem' },
  tagsRow:        { display:'flex', gap:'0.5rem', flexWrap:'wrap' },
  tag:            { background:'#f8f9fa', color:'#6c757d', padding:'0.25rem 0.75rem', borderRadius:'20px', fontSize:'0.8rem', border:'1px solid #e9ecef' },

  /* Amenities */
  amenitiesGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem' },
  amenity:       { display:'flex', alignItems:'center', gap:'0.75rem', background:'#f8f9fa', borderRadius:'10px', padding:'0.75rem', border:'1px solid #e9ecef' },
  amenityIcon:   { fontSize:'1.2rem' },
  amenityText:   { fontSize:'0.85rem', color:'#495057', fontWeight:'500' },

  /* Map */
  mapActions: { display:'flex', gap:'1rem', marginTop:'0.75rem' },
  mapLink:    { color:'#2d6a4f', fontSize:'0.85rem', fontWeight:'500', textDecoration:'none' },

  /* Reviews */
  reviewsHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' },
  addReviewBtn:   { background:'#f8f9fa', color:'#2d6a4f', border:'1.5px solid #2d6a4f', borderRadius:'10px', padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600' },
  reviewForm:     { background:'#f8f9fa', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.25rem', border:'1px solid #e9ecef' },
  reviewFormTitle:{ fontSize:'0.95rem', fontWeight:'600', color:'#1a1a2e', marginBottom:'0.75rem' },
  starsInput:     { display:'flex', alignItems:'center', gap:'0.25rem', marginBottom:'0.75rem' },
  starBtn:        { background:'none', border:'none', cursor:'pointer', fontSize:'1.8rem', padding:'0 2px', lineHeight:1 },
  starLabel:      { color:'#6c757d', fontSize:'0.85rem', marginLeft:'0.5rem' },
  reviewTextarea: { width:'100%', border:'1.5px solid #e9ecef', borderRadius:'10px', padding:'0.75rem', fontSize:'0.9rem', color:'#1a1a2e', resize:'none', outline:'none', background:'#fff', boxSizing:'border-box' },
  reviewFormBtns: { display:'flex', gap:'0.75rem', marginTop:'0.75rem', justifyContent:'flex-end' },
  cancelBtn:      { background:'#f8f9fa', color:'#6c757d', border:'1.5px solid #e9ecef', borderRadius:'8px', padding:'0.5rem 1rem', cursor:'pointer', fontSize:'0.85rem' },
  submitBtn:      { background:'#2d6a4f', color:'#fff', border:'none', borderRadius:'8px', padding:'0.5rem 1.25rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600' },
  successMsg:     { background:'#e8f5e9', color:'#2d6a4f', borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem', border:'1px solid #c8e6c9' },
  reviewsList:    { display:'flex', flexDirection:'column', gap:'1rem' },
  reviewCard:     { background:'#f8f9fa', borderRadius:'12px', padding:'1rem', border:'1px solid #f0f0f0' },
  reviewTop:      { display:'flex', alignItems:'flex-start', gap:'0.75rem', marginBottom:'0.75rem' },
  reviewAvatar:   { width:'40px', height:'40px', borderRadius:'50%', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1rem', flexShrink:0 },
  reviewMeta:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' },
  reviewUser:     { fontWeight:'600', color:'#1a1a2e', fontSize:'0.9rem' },
  reviewDate:     { color:'#adb5bd', fontSize:'0.8rem' },
  reviewStars:    { display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.85rem' },
  reviewRatingNum:{ color:'#f59e0b', fontWeight:'600', marginLeft:'0.25rem' },
  reviewText:     { color:'#495057', fontSize:'0.88rem', lineHeight:'1.6', marginBottom:'0.75rem' },
  reviewActions:  { display:'flex', gap:'0.75rem' },
  reviewActionBtn:{ background:'none', border:'none', color:'#adb5bd', cursor:'pointer', fontSize:'0.8rem', padding:'0' },

  /* Right panel */
  priceSection:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', padding:'1rem', background:'#f8f9fa', borderRadius:'12px' },
  priceLabelBig: { color:'#6c757d', fontSize:'0.9rem' },
  priceValueBig: { fontSize:'1.4rem', fontWeight:'700', color:'#2d6a4f' },
  primaryBtn:    { width:'100%', background:'#2d6a4f', color:'#fff', border:'none', borderRadius:'10px', padding:'0.9rem', cursor:'pointer', fontSize:'0.95rem', fontWeight:'600', marginBottom:'0.75rem', display:'block' },
  secondaryBtn:  { width:'100%', background:'#d8f3dc', color:'#2d6a4f', border:'1.5px solid #2d6a4f', borderRadius:'10px', padding:'0.75rem', cursor:'pointer', fontSize:'0.9rem', fontWeight:'600', marginBottom:'0.75rem', display:'block' },
  ghostBtn:      { width:'100%', background:'#f8f9fa', color:'#6c757d', border:'1.5px solid #e9ecef', borderRadius:'10px', padding:'0.75rem', cursor:'pointer', fontSize:'0.9rem', display:'block' },

  /* Rating summary */
  ratingBig:      { display:'flex', alignItems:'center', gap:'1.25rem', marginBottom:'1.25rem' },
  ratingBigNum:   { fontSize:'3.5rem', fontWeight:'800', color:'#1a1a2e', lineHeight:1 },
  starsRowBig:    { fontSize:'1.1rem', marginBottom:'0.25rem' },
  ratingSubText:  { color:'#6c757d', fontSize:'0.85rem', margin:0 },
  ratingBar:      { display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem' },
  ratingBarLabel: { fontSize:'0.8rem', color:'#6c757d', whiteSpace:'nowrap', width:'35px' },
  barTrack:       { flex:1, height:'8px', background:'#f0f0f0', borderRadius:'4px', overflow:'hidden' },
  barFill:        { height:'100%', borderRadius:'4px', transition:'width 0.3s' },
  ratingBarCount: { fontSize:'0.8rem', color:'#6c757d', width:'25px', textAlign:'right' },

  /* Info list */
  infoList:  { display:'flex', flexDirection:'column', gap:'0.75rem' },
  infoItem:  { display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.5rem 0', borderBottom:'1px solid #f8f9fa' },
  infoIcon:  { fontSize:'1.1rem', flexShrink:0, marginTop:'2px' },
  infoLabel: { color:'#adb5bd', fontSize:'0.75rem', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em' },
  infoValue: { color:'#1a1a2e', fontSize:'0.9rem', margin:0, fontWeight:'500' },

  /* Similar */
  similarDesc: { color:'#6c757d', fontSize:'0.85rem', marginBottom:'1rem', lineHeight:'1.5' },

  /* Photo Upload */
  uploadArea: { border: '2px dashed #2d6a4f', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: '#f8f9fa' },
  uploadBtn: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600' },
  uploadHint: { color: '#6c757d', fontSize: '0.8rem', marginTop: '0.5rem', margin: 0 },
  uploadedPhotosSection: { marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecef' },
  uploadedPhotosTitle: { fontSize: '0.95rem', fontWeight: '600', color: '#1a1a2e', marginBottom: '1rem' },
  uploadedPhotosGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' },
  uploadedPhotoCard: { position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#f8f9fa' },
  uploadedPhoto: { width: '100%', height: '140px', objectFit: 'cover', display: 'block' },
  deletePhotoBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(229,62,62,0.9)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  uploadedPhotoCardHover: {
    opacity: 1,
  },

  /* Footer */
  footer:     { background:'#1b4332', padding:'1.5rem 2rem', marginTop:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  footerText: { color:'rgba(255,255,255,0.5)', fontSize:'0.85rem' },
}
