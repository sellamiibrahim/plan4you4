const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// Dashboard overview
router.get('/', auth, adminAuth, adminController.getOverview);

// Users management
router.get('/users', auth, adminAuth, adminController.listUsers);
router.put('/users/:id', auth, adminAuth, adminController.updateUser);
router.delete('/users/:id', auth, adminAuth, adminController.deleteUser);

// Posts management
router.get('/posts', auth, adminAuth, adminController.listPosts);
router.put('/posts/:id', auth, adminAuth, adminController.updatePost);
router.delete('/posts/:id', auth, adminAuth, adminController.deletePost);

// Reviews management
router.get('/reviews', auth, adminAuth, adminController.listReviews);
router.put('/reviews/:id', auth, adminAuth, adminController.updateReview);
router.delete('/reviews/:id', auth, adminAuth, adminController.deleteReview);

module.exports = router;
