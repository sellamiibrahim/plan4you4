const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  preferences: {
    type: {
      wilaya:      { type: String, default: '' },
      interests:   [String],
      budget:      { type: Number, default: 200 },
      travelStyle: { type: String, default: '' }
    },
    default: {}
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)