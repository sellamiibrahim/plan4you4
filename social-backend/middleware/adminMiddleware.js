const User = require('../models/User')

module.exports = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Non autorise' })
    }

    const user = await User.findById(req.user.id).select('email role isAdmin')
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouve' })
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)

    const isAdmin =
      user.isAdmin === true ||
      user.role === 'admin' ||
      adminEmails.includes(user.email?.toLowerCase())

    if (!isAdmin) {
      return res.status(403).json({ message: 'Acces admin refuse' })
    }

    next()
  } catch (err) {
    console.error('Erreur admin middleware:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
