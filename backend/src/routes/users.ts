import express from 'express'
import Joi from 'joi'
import { authenticate } from '../middleware/authMiddleware'
import { requireCsrf } from '../middleware/csrfMiddleware'
import { partnershipActionRateLimit, writeRateLimit } from '../middleware/rateLimitMiddleware'
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

const partnershipIdSchema = Joi.object({
  id: Joi.string().trim().required()
})

const getValidationMessage = (error: Joi.ValidationError) => {
  return error.details[0]?.message || 'Invalid request payload'
}

const clampOrbitLevel = (value: number) => {
  return Math.max(0, Math.min(100, Math.round(value)))
}

const buildFallbackStars = (sharedInterests: Array<{ name: string; category: string }>) => {
  if (sharedInterests.length === 0) {
    return []
  }

  const centerX = 260
  const centerY = 170
  const radius = 110

  return sharedInterests.map((interest, index) => {
    const angle = (Math.PI * 2 * index) / sharedInterests.length

    return {
      id: `shared-${interest.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: interest.name,
      category: interest.category || 'custom',
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      brightness: 0.75
    }
  })
}

const buildFallbackConstellations = (stars: any[]) => {
  if (stars.length === 0) {
    return []
  }

  const connections: Array<[number, number]> = []

  for (let i = 0; i < stars.length - 1; i++) {
    connections.push([i, i + 1])
  }

  return [
    {
      id: 'shared-orbit',
      name: 'Shared Orbit',
      stars,
      connections
    }
  ]
}

const mapPartnerForUser = (partnership: any, userId: string) => {
  if (!partnership) {
    return null
  }

  const isOwner = partnership.userId === userId
  const partner = isOwner ? partnership.partner : partnership.user

  return {
    id: partnership.id,
    status: partnership.status,
    createdAt: partnership.createdAt,
    updatedAt: partnership.updatedAt,
    partner: partner
      ? {
          id: partner.id,
          username: partner.username,
          email: partner.email,
          avatar: partner.avatar || null
        }
      : null
  }
}

// Update user profile
router.put('/profile', authenticate, requireCsrf, writeRateLimit, async (req: any, res: any) => {
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

// Get cosmos data for active partnership
router.get('/cosmos', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const activePartnership = await prisma.partnership.findFirst({
      where: {
        status: 'active',
        OR: [
          { userId },
          { partnerId: userId }
        ]
      }
    })

    if (!activePartnership) {
      return res.json({
        stars: [],
        constellations: [],
        orbitLevel: 10
      })
    }

    const partnerId = activePartnership.userId === userId
      ? activePartnership.partnerId
      : activePartnership.userId

    const [currentUser, partnerUser, constellationData] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          interests: {
            include: {
              interest: true
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: partnerId },
        include: {
          interests: {
            include: {
              interest: true
            }
          }
        }
      }),
      prisma.constellationData.findUnique({
        where: { partnershipId: activePartnership.id }
      })
    ])

    const currentInterestMap = new Map(
      (currentUser?.interests || []).map((item) => [item.interest.name, item.interest.category || 'custom'])
    )
    const sharedInterests = (partnerUser?.interests || [])
      .map((item) => item.interest.name)
      .filter((name) => currentInterestMap.has(name))
      .map((name) => ({
        name,
        category: currentInterestMap.get(name) || 'custom'
      }))

    const fallbackStars = buildFallbackStars(sharedInterests)
    const fallbackConstellations = buildFallbackConstellations(fallbackStars)

    const rawPayload = constellationData?.stars as any
    const payloadSharedStars = Array.isArray(rawPayload?.sharedStars) ? rawPayload.sharedStars : []
    const payloadConstellations = Array.isArray(rawPayload?.constellations) ? rawPayload.constellations : []

    const normalizedStars = payloadSharedStars.length > 0
      ? payloadSharedStars.map((star: any, index: number) => ({
          id: String(star.id || `star-${index}`),
          name: String(star.name || `Star ${index + 1}`),
          category: String(star.category || 'custom'),
          x: Number(star.x || 200),
          y: Number(star.y || 200),
          brightness: Number(star.brightness || 0.75)
        }))
      : fallbackStars

    const starsById = new Map(normalizedStars.map((star: any) => [star.id, star]))

    const normalizedConstellations = payloadConstellations.length > 0
      ? payloadConstellations.map((constellation: any, index: number) => {
          const starList = Array.isArray(constellation.stars)
            ? constellation.stars
                .map((starRef: any) => {
                  if (typeof starRef === 'string') {
                    return starsById.get(starRef)
                  }

                  if (starRef && typeof starRef === 'object' && starRef.id) {
                    return starsById.get(String(starRef.id)) || starRef
                  }

                  return null
                })
                .filter(Boolean)
            : []

          const connections = Array.isArray(constellation.connections)
            ? constellation.connections
                .map((connection: any) => {
                  if (!Array.isArray(connection) || connection.length !== 2) {
                    return null
                  }

                  return [Number(connection[0]), Number(connection[1])] as [number, number]
                })
                .filter(Boolean)
            : []

          return {
            id: String(constellation.id || `constellation-${index}`),
            name: String(constellation.name || `Constellation ${index + 1}`),
            stars: starList,
            connections
          }
        })
      : fallbackConstellations

    const [recentMessages, recentCapsules] = await Promise.all([
      prisma.message.count({
        where: {
          partnershipId: activePartnership.id,
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
          }
        }
      }),
      prisma.capsule.count({
        where: {
          partnershipId: activePartnership.id,
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
          }
        }
      })
    ])

    const activityOrbitLevel = clampOrbitLevel(20 + recentMessages * 4 + recentCapsules * 2)
    const orbitLevel = clampOrbitLevel(constellationData?.orbitLevel ?? activityOrbitLevel)

    res.json({
      stars: normalizedStars,
      constellations: normalizedConstellations,
      orbitLevel
    })
  } catch (error) {
    console.error('Get cosmos error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get partnership state (active + pending)
router.get('/partnerships', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const [activePartnership, incomingInvites, outgoingInvites] = await Promise.all([
      prisma.partnership.findFirst({
        where: {
          status: 'active',
          OR: [
            { userId },
            { partnerId: userId }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          },
          partner: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          }
        }
      }),
      prisma.partnership.findMany({
        where: {
          status: 'pending',
          partnerId: userId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          },
          partner: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.partnership.findMany({
        where: {
          status: 'pending',
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          },
          partner: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    res.json({
      activePartnership: mapPartnerForUser(activePartnership, userId),
      incomingInvites: incomingInvites.map((partnership) => mapPartnerForUser(partnership, userId)),
      outgoingInvites: outgoingInvites.map((partnership) => mapPartnerForUser(partnership, userId))
    })
  } catch (error) {
    console.error('Get partnerships error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Send partnership invite
router.post('/partnership', authenticate, requireCsrf, partnershipActionRateLimit, async (req: any, res: any) => {
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

    // Check if partnership already exists in either direction
    const existingPartnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId, partnerId: partner.id },
          { userId: partner.id, partnerId: userId }
        ]
      }
    })

    if (existingPartnership?.status === 'active') {
      return res.status(400).json({ message: 'Partnership already active' })
    }

    // Auto-accept if target user already invited current user
    if (
      existingPartnership?.status === 'pending' &&
      existingPartnership.userId === partner.id &&
      existingPartnership.partnerId === userId
    ) {
      const partnership = await prisma.partnership.update({
        where: { id: existingPartnership.id },
        data: { status: 'active' }
      })

      return res.json({
        message: 'Partnership activated',
        status: 'active',
        partnership
      })
    }

    if (existingPartnership?.status === 'pending') {
      return res.status(400).json({ message: 'Pending invite already exists' })
    }

    if (existingPartnership?.status === 'inactive') {
      await prisma.partnership.delete({
        where: { id: existingPartnership.id }
      })
    }

    // Create pending invite
    const partnership = await prisma.partnership.create({
      data: {
        userId,
        partnerId: partner.id,
        status: 'pending'
      }
    })

    res.status(201).json({
      message: 'Partnership invite sent',
      status: 'pending',
      partnership
    })
  } catch (error) {
    console.error('Create partnership error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Accept partnership invite
router.post('/partnership/:id/accept', authenticate, requireCsrf, partnershipActionRateLimit, async (req: any, res: any) => {
  try {
    const { value, error } = partnershipIdSchema.validate(req.params, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const userId = req.user.id

    const partnership = await prisma.partnership.findUnique({
      where: { id: value.id }
    })

    if (!partnership) {
      return res.status(404).json({ message: 'Partnership invite not found' })
    }

    if (partnership.status !== 'pending') {
      return res.status(400).json({ message: 'Partnership invite is not pending' })
    }

    if (partnership.partnerId !== userId) {
      return res.status(403).json({ message: 'Only invited user can accept this invite' })
    }

    const updatedPartnership = await prisma.partnership.update({
      where: { id: value.id },
      data: { status: 'active' }
    })

    res.json({
      message: 'Partnership accepted',
      partnership: updatedPartnership
    })
  } catch (error) {
    console.error('Accept partnership error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Decline partnership invite
router.post('/partnership/:id/decline', authenticate, requireCsrf, partnershipActionRateLimit, async (req: any, res: any) => {
  try {
    const { value, error } = partnershipIdSchema.validate(req.params, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const userId = req.user.id

    const partnership = await prisma.partnership.findUnique({
      where: { id: value.id }
    })

    if (!partnership) {
      return res.status(404).json({ message: 'Partnership invite not found' })
    }

    if (partnership.status !== 'pending') {
      return res.status(400).json({ message: 'Partnership invite is not pending' })
    }

    if (partnership.partnerId !== userId) {
      return res.status(403).json({ message: 'Only invited user can decline this invite' })
    }

    await prisma.partnership.update({
      where: { id: value.id },
      data: { status: 'inactive' }
    })

    res.json({ message: 'Partnership invite declined' })
  } catch (error) {
    console.error('Decline partnership error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Cancel outgoing partnership invite
router.post('/partnership/:id/cancel', authenticate, requireCsrf, partnershipActionRateLimit, async (req: any, res: any) => {
  try {
    const { value, error } = partnershipIdSchema.validate(req.params, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const userId = req.user.id

    const partnership = await prisma.partnership.findUnique({
      where: { id: value.id }
    })

    if (!partnership) {
      return res.status(404).json({ message: 'Partnership invite not found' })
    }

    if (partnership.status !== 'pending') {
      return res.status(400).json({ message: 'Partnership invite is not pending' })
    }

    if (partnership.userId !== userId) {
      return res.status(403).json({ message: 'Only invite sender can cancel this invite' })
    }

    await prisma.partnership.update({
      where: { id: value.id },
      data: { status: 'inactive' }
    })

    res.json({ message: 'Partnership invite canceled' })
  } catch (error) {
    console.error('Cancel partnership invite error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Disconnect active partnership
router.delete('/partnership/:id', authenticate, requireCsrf, partnershipActionRateLimit, async (req: any, res: any) => {
  try {
    const { value, error } = partnershipIdSchema.validate(req.params, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const userId = req.user.id

    const partnership = await prisma.partnership.findUnique({
      where: { id: value.id }
    })

    if (!partnership) {
      return res.status(404).json({ message: 'Partnership not found' })
    }

    const isParticipant = partnership.userId === userId || partnership.partnerId === userId

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (partnership.status !== 'active') {
      return res.status(400).json({ message: 'Partnership is not active' })
    }

    await prisma.partnership.update({
      where: { id: value.id },
      data: { status: 'inactive' }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Disconnect partnership error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router