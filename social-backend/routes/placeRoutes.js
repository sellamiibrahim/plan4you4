const express = require('express')
const https = require('https')
const Place = require('../models/Place')

const router = express.Router()

const FOURSQUARE_BASE_URL = process.env.FOURSQUARE_BASE_URL || 'https://places-api.foursquare.com'
const FOURSQUARE_API_VERSION = process.env.FOURSQUARE_API_VERSION || '2025-02-05'
const DEFAULT_PHOTO_SIZE = 'original'

function getFoursquareApiKey() {
  return process.env.FOURSQUARE_API_KEY
}

function requestFoursquare(path, query = {}) {
  const apiKey = getFoursquareApiKey()

  if (!apiKey) {
    const error = new Error('FOURSQUARE_API_KEY is missing')
    error.status = 500
    throw error
  }

  const url = new URL(`${FOURSQUARE_BASE_URL}${path}`)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
          'X-Places-Api-Version': FOURSQUARE_API_VERSION,
        },
      },
      res => {
        let body = ''

        res.setEncoding('utf8')
        res.on('data', chunk => {
          body += chunk
        })
        res.on('end', () => {
          let parsed = null

          try {
            parsed = body ? JSON.parse(body) : null
          } catch {
            const error = new Error('Invalid response from Foursquare')
            error.status = 502
            return reject(error)
          }

          if (res.statusCode >= 400) {
            const error = new Error(parsed?.message || 'Foursquare request failed')
            error.status = res.statusCode
            error.details = parsed
            return reject(error)
          }

          resolve(parsed)
        })
      }
    )

    req.setTimeout(10000, () => {
      req.destroy(new Error('Foursquare request timed out'))
    })
    req.on('error', reject)
    req.end()
  })
}

function buildPhotoUrl(photo, size = DEFAULT_PHOTO_SIZE) {
  if (typeof photo === 'string') {
    return photo
  }

  if (photo?.url) {
    return photo.url
  }

  if (!photo?.prefix || !photo?.suffix) {
    return null
  }

  return `${photo.prefix}${size}${photo.suffix}`
}

function getPlaceCoordinates(place) {
  const lat = place.coords?.lat
  const lng = place.coords?.lng

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null
  }

  return `${lat},${lng}`
}

async function findFoursquarePlace(place) {
  const ll = getPlaceCoordinates(place)

  const data = await requestFoursquare('/places/search', {
    query: place.name,
    ll,
    near: ll ? undefined : `${place.wilaya}, Tunisia`,
    limit: 1,
    radius: ll ? 5000 : undefined,
    fields: 'fsq_place_id,name,location,photos',
  })

  return data?.results?.[0] || null
}

function getFirstPhoto(place) {
  if (Array.isArray(place?.photos)) {
    return place.photos[0]
  }

  if (Array.isArray(place?.photos?.items)) {
    return place.photos.items[0]
  }

  return null
}

async function fetchFoursquarePhotoUrl(place) {
  const fsqPlace = await findFoursquarePlace(place)
  const searchPhotoUrl = buildPhotoUrl(getFirstPhoto(fsqPlace))

  if (searchPhotoUrl) {
    return searchPhotoUrl
  }

  const fsqPlaceId = fsqPlace?.fsq_place_id || fsqPlace?.fsq_id

  if (!fsqPlaceId) {
    return null
  }

  const details = await requestFoursquare(`/places/${fsqPlaceId}`, {
    fields: 'fsq_place_id,name,photos',
  })

  return buildPhotoUrl(getFirstPhoto(details))
}

async function addPhotoIfMissing(place) {
  if (place.image) {
    return place
  }

  try {
    const image = await fetchFoursquarePhotoUrl(place)

    if (!image) {
      return place
    }

    place.image = image
    await place.save()
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      throw err
    }

    console.warn(`Foursquare photo skipped for ${place.name}: ${err.message}`)
  }

  return place
}

function buildPlaceFilter(query) {
  const filter = {}

  if (query.wilaya) {
    filter.wilaya = query.wilaya
  }

  if (query.category) {
    filter.category = query.category
  }

  return filter
}

function getRequestLimit(value) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 100
  }

  return Math.min(parsed, 100)
}

router.get('/', async (req, res) => {
  try {
    const limit = getRequestLimit(req.query.limit)
    const withPhotos = req.query.withPhotos !== 'false'

    const places = await Place.find(buildPlaceFilter(req.query))
      .sort('-rating')
      .limit(limit)

    if (withPhotos) {
      for (const place of places) {
        await addPhotoIfMissing(place)
      }
    }

    res.json(places)
  } catch (err) {
    console.error(err)
    res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)

    if (!place) {
      return res.status(404).json({ message: 'Place introuvable' })
    }

    await addPhotoIfMissing(place)
    res.json(place)
  } catch (err) {
    console.error(err)
    res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' })
  }
})

router.post('/:id/photo', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)

    if (!place) {
      return res.status(404).json({ message: 'Place introuvable' })
    }

    const image = await fetchFoursquarePhotoUrl(place)

    if (!image) {
      return res.status(404).json({ message: 'Aucune photo Foursquare trouvee' })
    }

    place.image = image
    await place.save()

    res.json({ image: place.image, place })
  } catch (err) {
    console.error(err)
    res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' })
  }
})

module.exports = router
