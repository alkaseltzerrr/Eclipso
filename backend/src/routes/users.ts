import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'

const router = express.Router()
const prisma = new PrismaClient()

// Update user profile
router.put('/profile', authenticate, async (req: any, res: any) => {
  try {
    const { interests, avatar, isOnboarded } = req.body
    const userId = req.user.id

    // Update user basic info
    const updateData: any = {}
    if (avatar !== undefined) updateData.avatar = avatar
    if (isOnboarded !== undefined) updateData.isOnboarded = isOnboarded

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Update interests if provided
    if (interests && Array.isArray(interests)) {
      // Remove existing interests
      await prisma.userInterest.deleteMany({
        where: { userId }
      })

      // Add new interests
      for (const interestName of interests) {
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
    const { partnerEmail } = req.body
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