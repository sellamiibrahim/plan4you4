const path = require('path')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const User = require('../models/User')

const ensureAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@gmail.com'
  const password = process.env.ADMIN_PASSWORD || '123456'
  const hashed = await bcrypt.hash(password, 10)

  await mongoose.connect(process.env.MONGO_URI)

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

ensureAdmin()
  .catch(err => {
    console.error('Admin seed failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
