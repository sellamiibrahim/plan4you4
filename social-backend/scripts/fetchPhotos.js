// fetchPhotos.js – fetch and store Foursquare photos for places missing an image
// Run with: node scripts/fetchPhotos.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const https = require('https')
const Place = require('../models/Place')

// Wikimedia endpoint does not need these constants
// (kept for reference – can be removed if unused)

function getFoursquareApiKey() { return process.env.FOURSQUARE_API_KEY }

function requestFoursquare(path, query = {}) {
  const apiKey = getFoursquareApiKey()
  if (!apiKey) throw Object.assign(new Error('FOURSQUARE_API_KEY is missing'), { status: 500 })
  const url = new URL(`${FOURSQUARE_BASE_URL}${path}`)
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
        'X-Places-Api-Version': FOURSQUARE_API_VERSION,
      },
    }, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        let parsed = null
        try { parsed = body ? JSON.parse(body) : null }
        catch { return reject(Object.assign(new Error('Invalid response from Foursquare'), { status: 502 })) }
        if (res.statusCode >= 400) {
          const err = new Error(parsed?.message || 'Foursquare request failed')
          err.status = res.statusCode
          err.details = parsed
          return reject(err)
        }
        resolve(parsed)
      })
    })
    req.setTimeout(10000, () => req.destroy(new Error('Foursquare request timed out')))
    req.on('error', reject)
    req.end()
  })
}

function buildPhotoUrl(photo, size = DEFAULT_PHOTO_SIZE) {
  if (typeof photo === 'string') return photo
  if (photo?.url) return photo.url
  if (!photo?.prefix || !photo?.suffix) return null
  return `${photo.prefix}${size}${photo.suffix}`
}

function getFirstPhoto(place) {
  if (Array.isArray(place?.photos)) return place.photos[0]
  if (Array.isArray(place?.photos?.items)) return place.photos.items[0]
  return null
}

// Wikimedia Commons API helper
function requestWikimediaApi(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  // Ensure required parameters
  params.action = params.action || 'query';
  params.format = 'json';
  // Add origin=* to avoid CORS issues when used client‑side (harmless here)
  params.origin = '*';
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        // Wikimedia API requires a User-Agent for identification
        'User-Agent': 'SocialApp/1.0 (https://github.com/yourrepo)'
      },
    }, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          if (res.statusCode >= 400) {
            const err = new Error(parsed?.error?.info || 'Wikimedia request failed');
            err.status = res.statusCode;
            err.details = parsed;
            return reject(err);
          }
          // If the API returns a warning object but valid data, ignore warnings
          resolve(parsed);
        } catch (e) {
          // Return empty object on JSON parse failure
          resolve({});
        }
      })
    })
    req.setTimeout(10000, () => req.destroy(new Error('Wikimedia request timed out')))
    req.on('error', reject)
    req.end()
  });
}

// Fetch a Wikimedia image near the place coordinates, falling back to a name search
async function fetchWikimediaPhotoUrl(place) {
  if (!place.name) return null;
  // Search for a file matching the place name
  const search = await requestWikimediaApi({
    list: 'search',
    srsearch: place.name,
    srnamespace: '6', // File namespace
    srlimit: '10',
  });
  const results = search?.query?.search || [];
  for (const result of results) {
    const info = await requestWikimediaApi({
      prop: 'imageinfo',
      titles: result.title,
      iiprop: 'url',
    });
    const pages = info?.query?.pages || {};
    const firstPage = Object.values(pages)[0];
    const img = firstPage?.imageinfo?.[0];
    if (img?.url) return img.url;
  }
  return null;
}

async function fetchFoursquarePhotoUrl(place) {
  // Find the place on Foursquare (search by name & location)
  const ll = place.coords?.lat && place.coords?.lng ? `${place.coords.lat},${place.coords.lng}` : null
  const search = await requestFoursquare('/places/search', {
    query: place.name,
    ll,
    near: ll ? undefined : `${place.wilaya}, Tunisia`,
    limit: 1,
    radius: ll ? 5000 : undefined,
    fields: 'fsq_place_id,name,location,photos',
  })
  const fsqPlace = search?.results?.[0] || null
  if (!fsqPlace) return null
  const photo = buildPhotoUrl(getFirstPhoto(fsqPlace))
  if (photo) return photo
  const id = fsqPlace.fsq_place_id || fsqPlace.fsq_id
  if (!id) return null
  const details = await requestFoursquare(`/places/${id}`, { fields: 'fsq_place_id,name,photos' })
  return buildPhotoUrl(getFirstPhoto(details))
}

async function addPhotoIfMissing(place) {
  if (place.image) return place
  try {
    const image = await fetchWikimediaPhotoUrl(place)
    if (image) {
      place.image = image
      await place.save()
      console.log(`✅ Photo added for ${place.name}`)
    } else {
      console.warn(`⚠️ No Wikimedia photo found for ${place.name}`)
    }
  } catch (err) {
    console.warn(`⚠️ Wikimedia error for ${place.name}: ${err.message}`)
  }
  return place
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('🔗 Connected to MongoDB')
  const cursor = Place.find({ $or: [{ image: { $exists: false } }, { image: null }] }).cursor()
  let processed = 0
  for await (const place of cursor) {
    await addPhotoIfMissing(place)
    processed++
  }
  console.log(`🏁 Processed ${processed} places`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
