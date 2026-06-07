const router = require('express').Router()
const auth = require('../middleware/authMiddleware')
const { getPosts, getUserPosts, createPost, likePost } = require('../controllers/postController')

router.get('/',           auth, getPosts)
router.get('/user/:id',   auth, getUserPosts)
router.post('/',          auth, createPost)
router.post('/:id/like',  auth, likePost)

module.exports = router
