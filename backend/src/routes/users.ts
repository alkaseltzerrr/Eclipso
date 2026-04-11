import express from 'express'
import Joi from 'joi'
import { authenticate } from '../middleware/authMiddleware'
import prisma from '../lib/prisma'

const router = express.Router()

const profileSchema = Joi.object({
  interests: Joi.array().items(Joi.string().trim().min(1).max(40)).max(30),
  avatar: Joi.string().trim().max(255).allow(null, ''),
  isOnboarded: Joi.boolean()
})
  .or('interests', 'avatar', 'isOnboarded')
  .required()

const partnershipSchema = Joi.object({
  partnerEmail: Joi.string().trim().lowercase().email().max(254).required()
})

const getValidationMessage = (error: Joi.ValidationError) => {
  return error.details[0]?.message || 'Invalid request payload'
}

// Update user profile
router.put('/profile', authenticate, async (req: any, res: any) => {
  try {
    const { value, error } = profileSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const { interests, avatar, isOnboarded } = value
    const userId = req.user.id

    // Update user basic info
    const updateData: any = {}
    if (avatar !== undefined) updateData.avatar = avatar || null
    if (isOnboarded !== undefined) updateData.isOnboarded = isOnboarded

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Update interests if provided
    if (interests && Array.isArray(interests)) {
      const normalizedInterests = Array.from(new Set(
        interests
          .map((interest: string) => interest.trim())
          .filter((interest: string) => interest.length > 0)
      ))

      // Remove existing interests
      await prisma.userInterest.deleteMany({
        where: { userId }
      })

      // Add new interests
      for (const interestName of normalizedInterests) {
        // Find or create interest
        let interest = await prisma.interest.findUnique({
          where: { name: interestName }
        })

        if (!interest) {
          interest = await prisma.interest.create({
            data: {
              name: interestName,
              category: 'custom' // Default category
            }
          })
        }

        // Create user-interest relationship
        await prisma.userInterest.create({
          data: {
            userId,
            interestId: interest.id
          }
        })
      }
    }

    // Get updated user with interests
    const userWithInterests = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          include: {
            interest: true
          }
        }
      }
    })

    const userInterests = userWithInterests?.interests.map((ui: any) => ui.interest.name) || []
    const { password: _, interests: __, ...userWithoutPassword } = userWithInterests!

    res.json({
      ...userWithoutPassword,
      interests: userInterests
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get available interests
router.get('/interests', async (req: any, res: any) => {
  try {
    const interests = await prisma.interest.findMany({
      orderBy: { name: 'asc' }
    })

    res.json(interests)
  } catch (error) {
    console.error('Get interests error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create or update partnership
router.post('/partnership', authenticate, async (req: any, res: any) => {
  try {
    const { value, error } = partnershipSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const { partnerEmail } = value
    const userId = req.user.id

    // Find partner by email
    const partner = await prisma.user.findUnique({
      where: { email: partnerEmail }
    })

    if (!partner) {
      return res.status(404).json({ message: 'User not found with this email' })
    }

    if (partner.id === userId) {
      return res.status(400).json({ message: 'Cannot partner with yourself' })
    }

    // Check if partnership already exists
    const existingPartnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId, partnerId: partner.id },
          { userId: partner.id, partnerId: userId }
        ]
      }
    })

    if (existingPartnership) {
      return res.status(400).json({ message: 'Partnership already exists' })
    }

    // Create partnership
    const partnership = await prisma.partnership.create({
      data: {
        userId,
        partnerId: partner.id,
        status: 'active'
      }
    })

    res.json({ message: 'Partnership created successfully', partnership })
  } catch (error) {
    console.error('Create partnership error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router