const Post = require('../models/Post');
const Review = require('../models/Review');
const User = require('../models/User');

// ---------- Overview ----------
exports.getOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalReviews,
      pendingReviews,
      recentPosts,
      recentReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Post.find()
        .populate('author', 'username email')
        .sort('-createdAt')
        .limit(5),
      Review.find()
        .populate('author', 'username email')
        .populate('post', 'title')
        .sort('-createdAt')
        .limit(5),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalReviews,
        pendingReviews,
      },
      recentPosts,
      recentReviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching admin overview' });
  }
};

// ---------- Users ----------
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('-createdAt');

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (typeof req.body.username === 'string') updates.username = req.body.username.trim();
    if (typeof req.body.email === 'string') updates.email = req.body.email.trim().toLowerCase();
    if (['user', 'admin'].includes(req.body.role)) {
      updates.role = req.body.role;
      updates.isAdmin = req.body.role === 'admin';
    }
    if (typeof req.body.isAdmin === 'boolean') {
      updates.isAdmin = req.body.isAdmin;
      updates.role = req.body.isAdmin ? 'admin' : 'user';
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const result = await User.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// ---------- Posts ----------
exports.listPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username').sort('-createdAt');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // allow any fields to be updated
    const post = await Post.findByIdAndUpdate(id, updates, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Post.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
};

// ---------- Reviews ----------
exports.listReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('author', 'username')
      .populate('post', 'title')
      .sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., {status: 'approved'}
    const review = await Review.findByIdAndUpdate(id, updates, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Review.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
};
