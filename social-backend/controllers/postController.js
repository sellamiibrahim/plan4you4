const Post = require('../models/Post')

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username').sort('-createdAt')
    res.json(posts)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id }).populate('author', 'username').sort('-createdAt')
    res.json(posts)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.createPost = async (req, res) => {
  try {
    const post = await Post.create({ content: req.body.content, author: req.user.id })
    await post.populate('author', 'username')
    res.status(201).json(post)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post.likes.includes(req.user.id)) {
      await post.updateOne({ $push: { likes: req.user.id } })
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } })
    }
    res.json({ message: 'OK' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}