const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
console.log('MONGO_URI:', process.env.MONGO_URI)

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

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connecté')
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server ykhdem 3al port 5000')
    })
  })
  .catch(err => console.error('Erreur MongoDB:', err))
