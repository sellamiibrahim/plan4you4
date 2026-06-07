const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  title: { type: String },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text:    { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)