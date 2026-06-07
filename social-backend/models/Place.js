const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  wilaya: { type: String, required: true },
  address: { type: String },
  price: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  coords: {
    lat: Number,
    lng: Number
  },
  image: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Place', placeSchema);