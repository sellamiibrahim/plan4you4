const router = require('express').Router()
const auth = require('../middleware/authMiddleware')
const { getUser, followUser } = require('../controllers/userController')

router.get('/:id',        auth, getUser)
router.post('/:id/follow', auth, followUser)
router.put('/:id/preferences', auth, async (req, res) => {
  try {
    const { wilaya, interests, budget, travelStyle } = req.body
    await User.findByIdAndUpdate(req.params.id, {
      preferences: { wilaya, interests, budget, travelStyle }
    })
    res.json({ message: 'Préférences sauvegardées!' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})
module.exports = router
