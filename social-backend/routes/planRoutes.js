const router = require('express').Router()
const auth   = require('../middleware/authMiddleware')
const {
  generatePlan,
  getPlans,
  getMyPlans,
  sharePlan,
  likePlan,
  getRecommended,
  getPlacesByWilaya,
} = require('../controllers/planController')

router.post('/generate',          auth, generatePlan)
router.get('/',                   auth, getPlans)
router.get('/my',                 auth, getMyPlans)
router.get('/recommended',        auth, getRecommended)
router.get('/places/:wilaya',     auth, getPlacesByWilaya)
router.put('/:id/share',          auth, sharePlan)
router.post('/:id/like',          auth, likePlan)

module.exports = router