const router = require('express').Router()
const auth = require('../middleware/authMiddleware')
const { getUser, followUser, updatePreferences } = require('../controllers/userController')

router.get('/:id',         auth, getUser)
router.post('/:id/follow', auth, followUser)
router.patch('/:id/preferences', auth, updatePreferences)
// accept POST as well for clients that send onboarding via POST
router.post('/:id/preferences', auth, updatePreferences)

module.exports = router