const Plan  = require('../models/Plan')
const Place = require('../models/Place')

exports.generatePlan = async (req, res) => {
  try {
    const { city, budget, duration } = req.body

    // Jib les places men database 7asb wilaya
    const places = await Place.find({ wilaya: city }).sort('-rating')

    let selected = []
    let total    = 0

    // Algo: sort by rating, filter by budget
    for (const place of places) {
      if (total + place.price <= budget) {
        selected.push({
          name:     place.name,
          category: place.category,
          price:    place.price,
          rating:   place.rating,
          coords:   place.coords,
          image:    place.image,
          address:  place.address,
        })
        total += place.price
      }
    }

    // Fallback ki mafich places
    if (selected.length === 0) {
      return res.status(404).json({ message: `Aucune place trouvée pour ${city}` })
    }

    const plan = await Plan.create({
      author:     req.user.id,
      city,
      budget,
      duration,
      activities: selected,
      totalCost:  total,
    })

    res.status(201).json(plan)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isShared: true })
      .populate('author', 'username')
      .sort('-createdAt')
    res.json(plans)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.getMyPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ author: req.user.id }).sort('-createdAt')
    res.json(plans)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.sharePlan = async (req, res) => {
  try {
    await Plan.findByIdAndUpdate(req.params.id, { isShared: true })
    res.json({ message: 'Plan partagé!' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.likePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
    if (!plan.likes.includes(req.user.id)) {
      await plan.updateOne({ $push: { likes: req.user.id } })
    } else {
      await plan.updateOne({ $pull: { likes: req.user.id } })
    }
    res.json({ message: 'OK' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

exports.getRecommended = async (req, res) => {
  try {
    const myPlans   = await Plan.find({ author: req.user.id })
    const cities    = myPlans.map(p => p.city)
    const avgBudget = myPlans.length > 0
      ? myPlans.reduce((s, p) => s + p.budget, 0) / myPlans.length
      : 200

    const recommended = await Plan.find({
      isShared: true,
      author:   { $ne: req.user.id },
      $or: [
        { city:   { $in: cities } },
        { budget: { $gte: avgBudget * 0.7, $lte: avgBudget * 1.3 } }
      ]
    })
    .populate('author', 'username')
    .sort('-likes')
    .limit(10)

    res.json(recommended)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Get places by wilaya
exports.getPlacesByWilaya = async (req, res) => {
  try {
    const places = await Place.find({ wilaya: req.params.wilaya }).sort('-rating')
    res.json(places)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}