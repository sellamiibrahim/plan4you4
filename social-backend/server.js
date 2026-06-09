const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: path.join(__dirname, '.env') })
console.log('MONGO_URI:', process.env.MONGO_URI)

const User = require('./models/User')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')
const planRoutes = require('./routes/planRoutes')
const placeRoutes = require('./routes/placeRoutes')


const app = express()
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/places', placeRoutes)
const adminRoutes = require('./routes/adminRoutes')
app.use('/api/admin', adminRoutes)

const ensureDefaultAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@gmail.com'
  const password = process.env.ADMIN_PASSWORD || '123456'
  const hashed = await bcrypt.hash(password, 10)

  const existing = await User.findOne({ email })
  if (existing) {
    existing.password = hashed
    existing.role = 'admin'
    existing.isAdmin = true
    await existing.save()
    console.log(`Admin account ready: ${email}`)
    return
  }

  const adminUsernameExists = await User.exists({ username: 'admin' })
  await User.create({
    username: adminUsernameExists ? `admin_${Date.now()}` : 'admin',
    email,
    password: hashed,
    role: 'admin',
    isAdmin: true,
    followers: [],
    following: [],
    preferences: {},
  })
  console.log(`Admin account created: ${email}`)
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connecté')
    await ensureDefaultAdmin()
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server ykhdem 3al port 5000')
    })
  })
  .catch(err => console.error('Erreur MongoDB:', err))
