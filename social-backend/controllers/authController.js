const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
  try {
    const { username, email, password, preferences } = req.body

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' })

    const hashed = await bcrypt.hash(password, 10)

    // normalize interests to array if sent as comma-separated string
    const interests = Array.isArray(preferences?.interests)
      ? preferences.interests
      : (typeof preferences?.interests === 'string' && preferences.interests.length)
        ? preferences.interests.split(',').map(s => s.trim()).filter(Boolean)
        : []

    // coerce budget to number if possible (accept numeric strings)
    const budget = (() => {
      if (preferences?.budget === undefined || preferences?.budget === null) return 200
      const n = Number(preferences.budget)
      return Number.isFinite(n) ? n : 200
    })()

    const user = await User.create({
      username,
      email,
      password: hashed,
      followers: [],
      following: [],
      preferences: {
        wilaya: preferences?.wilaya || '',
        interests: interests,
        budget: budget,
        travelStyle: preferences?.travelStyle || '',
      }
    })

    res.status(201).json({ message: 'Compte créé avec succès', user: { _id: user._id, username: user.username, preferences: user.preferences } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Email incorrect' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Mot de passe incorrect' })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email } })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}