const mongoose = require('mongoose')
const axios    = require('axios')
const path     = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const Place = require('../models/Place')

const WILAYAS = [
  { name: 'Tunis',       lat: 36.8065, lng: 10.1815 },
  { name: 'Sousse',      lat: 35.8256, lng: 10.6369 },
  { name: 'Sfax',        lat: 34.7406, lng: 10.7603 },
  { name: 'Djerba',      lat: 33.8075, lng: 10.8451 },
  { name: 'Hammamet',    lat: 36.4000, lng: 10.6167 },
  { name: 'Monastir',    lat: 35.7643, lng: 10.8113 },
  { name: 'Nabeul',      lat: 36.4561, lng: 10.7376 },
  { name: 'Bizerte',     lat: 37.2744, lng:  9.8739 },
  { name: 'Kairouan',    lat: 35.6781, lng: 10.0963 },
  { name: 'Gabès',       lat: 33.8815, lng: 10.0982 },
  { name: 'Gafsa',       lat: 34.4250, lng:  8.7842 },
  { name: 'Tozeur',      lat: 33.9197, lng:  8.1335 },
  { name: 'Tataouine',   lat: 32.9211, lng: 10.4518 },
  { name: 'Médenine',    lat: 33.3549, lng: 10.5055 },
  { name: 'Béja',        lat: 36.7256, lng:  9.1817 },
  { name: 'Jendouba',    lat: 36.5011, lng:  8.7757 },
  { name: 'Le Kef',      lat: 36.1676, lng:  8.7147 },
  { name: 'Siliana',     lat: 36.0844, lng:  9.3708 },
  { name: 'Kasserine',   lat: 35.1676, lng:  8.8365 },
  { name: 'Sidi Bouzid', lat: 35.0382, lng:  9.4849 },
  { name: 'Mahdia',      lat: 35.5047, lng: 11.0622 },
  { name: 'Zaghouan',    lat: 36.4028, lng: 10.1428 },
  { name: 'Ariana',      lat: 36.8663, lng: 10.1647 },
  { name: 'Ben Arous',   lat: 36.7533, lng: 10.2283 },
]

const CATEGORIES = [
  { osm: 'amenity=restaurant',  cat: 'restaurant', price: 35 },
  { osm: 'amenity=cafe',        cat: 'café',        price: 15 },
  { osm: 'tourism=attraction',  cat: 'activité',    price: 10 },
  { osm: 'tourism=museum',      cat: 'activité',    price: 8  },
  { osm: 'tourism=hotel',       cat: 'hébergement', price: 120 },
  { osm: 'leisure=beach_resort',cat: 'activité',    price: 0  },
  { osm: 'amenity=fast_food',   cat: 'restaurant',  price: 20 },
]

async function fetchPlaces(wilaya, category) {
  const { lat, lng } = wilaya
  const radius = 15000 // 15km

  const query = `
    [out:json][timeout:30];
    (
      node[${category.osm}](around:${radius},${lat},${lng});
      way[${category.osm}](around:${radius},${lat},${lng});
    );
    out center 10;
  `

  try {
    const res = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { headers: { 'Content-Type': 'text/plain' }, timeout: 35000 }
    )

    return res.data.elements
      .filter(el => el.tags?.name)
      .slice(0, 10)
      .map(el => ({
        name:     el.tags.name,
        category: category.cat,
        wilaya:   wilaya.name,
        price:    category.price,
        rating:   parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        coords: {
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon,
        },
        address:  el.tags['addr:street'] || el.tags['addr:full'] || null,
        tags:     [wilaya.name, category.cat],
      }))
  } catch (err) {
    console.error(`  ⚠ Erreur ${wilaya.name} / ${category.osm}: ${err.message}`)
    return []
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ MongoDB connecté')

    await Place.deleteMany({})
    console.log('🗑  Places supprimées')

    let total = 0

    for (const wilaya of WILAYAS) {
      console.log(`\n📍 ${wilaya.name}...`)

      for (const category of CATEGORIES) {
        const places = await fetchPlaces(wilaya, category)

        for (const place of places) {
          // Avoid duplicates
          const exists = await Place.findOne({ name: place.name, wilaya: place.wilaya })
          if (!exists) {
            await Place.create(place)
            total++
          }
        }

        console.log(`  ✓ ${category.cat}: ${places.length} places`)
        await sleep(1000) // Respect Overpass rate limit
      }
    }

    console.log(`\n🎉 Total: ${total} places importées!`)
    process.exit(0)
  } catch (err) {
    console.error('Erreur:', err)
    process.exit(1)
  }
}

seed()