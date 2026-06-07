const User = require('../models/User')

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' })
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.followUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id)
    const me = await User.findById(req.user.id)
    if (!target.followers.includes(req.user.id)) {
      await target.updateOne({ $push: { followers: req.user.id } })
      await me.updateOne({ $push: { following: req.params.id } })
    } else {
      await target.updateOne({ $pull: { followers: req.user.id } })
      await me.updateOne({ $pull: { following: req.params.id } })
    }
    res.json({ message: 'OK' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.updatePreferences = async (req, res) => {
  try {
    const id = req.params.id
    if (req.user.id !== id) return res.status(403).json({ message: 'Accès refusé' })

    const { budget, budgetIncrement, wilaya, interests, travelStyle } = req.body

    const update = {}
    // prepare set operations
    const setOps = {}
    // accept numeric strings as well as numbers for budget
    if (budget !== undefined) {
      const b = Number(budget)
      if (Number.isFinite(b)) setOps['preferences.budget'] = b
    }
    if (typeof wilaya === 'string') setOps['preferences.wilaya'] = wilaya
    if (typeof travelStyle === 'string') setOps['preferences.travelStyle'] = travelStyle
    if (interests !== undefined) {
      const normInterests = Array.isArray(interests)
        ? interests
        : (typeof interests === 'string' && interests.length)
          ? interests.split(',').map(s => s.trim()).filter(Boolean)
          : []
      setOps['preferences.interests'] = normInterests
    }

    if (Object.keys(setOps).length) update.$set = setOps
    // accept numeric strings for budget increment as well
    if (budgetIncrement !== undefined) {
      const bi = Number(budgetIncrement)
      if (Number.isFinite(bi)) update.$inc = { 'preferences.budget': bi }
    }

    if (!Object.keys(update).length) return res.status(400).json({ message: 'Rien à mettre à jour' })

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' })
    res.json({ message: 'Préférences mises à jour', preferences: user.preferences })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}