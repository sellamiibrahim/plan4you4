const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const Place = require('../models/Place')
const wilayas = require('../data/wilayas')

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connecté')

    await Place.deleteMany({})
    console.log('Places supprimées')

    let total = 0
    for (const [wilaya, data] of Object.entries(wilayas)) {
      for (const place of data.places) {
        await Place.create({
          name:     place.name,
          category: place.category === 'hébergement' ? 'hébergement' : place.category,
          wilaya,
          price:    place.price,
          rating:   place.rating,
          coords:   place.coords,
          image:    place.image || null,
          tags:     [wilaya, place.category],
        })
        total++
      }
    }

    console.log(`✅ ${total} places importées!`)
    process.exit(0)
  } catch (err) {
    console.error('Erreur:', err)
    process.exit(1)
  }
}

seed()