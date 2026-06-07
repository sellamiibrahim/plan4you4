const mongoose = require('mongoose')

const planSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city:     { type: String, required: true },
  budget:   { type: Number, required: true },
  duration: { type: String, required: true },
  activities: [{
    name:     { type: String },
    category: { type: String }, // restaurant, activité, transport, hébergement
    price:    { type: Number },
    time:     { type: String },
  }],
  totalCost: { type: Number },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:  [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  isShared: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Plan', planSchema)