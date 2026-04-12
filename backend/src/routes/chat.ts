import express from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { requireCsrf } from '../middleware/csrfMiddleware'
import { writeRateLimit } from '../middleware/rateLimitMiddleware'
import prisma from '../lib/prisma'

const router = express.Router()

const findActivePartnership = async (userId: string, partnerId: string) => {
  return prisma.partnership.findFirst({
    where: {
      status: 'active',
      OR: [
        { userId, partnerId },
        { userId: partnerId, partnerId: userId }
      ]
    }
  })
}

const formatCapsuleForUser = (capsule: any, userId: string) => {
  const unlockVotes = Array.isArray(capsule.unlockVotes) ? capsule.unlockVotes : []
  const unlockVotesRequired = capsule.isLocked && capsule.partnershipId ? 2 : 1
  const unlockVotesCount = unlockVotes.length
  const viewerHasVoted = unlockVotes.some((vote: any) => vote.userId === userId)

  return {
    ...capsule,
    unlockVotesCount,
    unlockVotesRequired,
    viewerHasVoted
  }
}

// Get chat messages
router.get('/messages', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const { partnerId, cursor } = req.query

    const parsedLimit = Number(req.query.limit)
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 30

    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID required' })
    }

    const activePartnership = await findActivePartnership(userId, partnerId as string)

    if (!activePartnership) {
      return res.status(403).json({ message: 'No active partnership with this user' })
    }

    // Load newest first for stable cursor paging, then reverse for UI chronology
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId as string },
          { senderId: partnerId as string, receiverId: userId }
        ]
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor as string },
            skip: 1
          }
        : {})
    })

    const hasMore = messages.length > limit
    const pagedMessages = hasMore ? messages.slice(0, limit) : messages
    const chronologicalMessages = [...pagedMessages].reverse()
    const nextCursor = hasMore ? pagedMessages[pagedMessages.length - 1].id : null

    res.json({
      messages: chronologicalMessages,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a new message
router.post('/messages', authenticate, requireCsrf, writeRateLimit, async (req: any, res: any) => {
  try {
    const { content, receiverId, type = 'text' } = req.body
    const senderId = req.user.id

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID required' })
    }

    const normalizedContent = String(content || '').trim()

    if (!normalizedContent) {
      return res.status(400).json({ message: 'Message content required' })
    }

    const activePartnership = await findActivePartnership(senderId, receiverId)

    if (!activePartnership) {
      return res.status(403).json({ message: 'No active partnership with this user' })
    }

    const message = await prisma.message.create({
      data: {
        content: normalizedContent,
        type,
        senderId,
        receiverId,
        partnershipId: activePartnership.id
      }
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('Create message error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Mark messages as read
router.put('/messages/read', authenticate, requireCsrf, writeRateLimit, async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const { partnerId } = req.body

    if (!partnerId || typeof partnerId !== 'string') {
      return res.status(400).json({ message: 'Partner ID required' })
    }

    const activePartnership = await findActivePartnership(userId, partnerId)

    if (!activePartnership) {
      return res.status(403).json({ message: 'No active partnership with this user' })
    }

    const readAt = new Date()

    const updated = await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        partnershipId: activePartnership.id,
        readAt: null
      },
      data: {
        readAt
      }
    })

    res.json({
      updatedCount: updated.count,
      readAt: readAt.toISOString()
    })
  } catch (error) {
    console.error('Mark messages read error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get capsules
router.get('/capsules', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const capsules = await prisma.capsule.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            partnership: {
              OR: [
                { userId },
                { partnerId: userId }
              ]
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        unlockVotes: {
          select: {
            userId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(capsules.map((capsule) => formatCapsuleForUser(capsule, userId)))
  } catch (error) {
    console.error('Get capsules error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a new capsule
router.post('/capsules', authenticate, requireCsrf, writeRateLimit, async (req: any, res: any) => {
  try {
    const { title, content, type = 'text', isLocked = false } = req.body
    const userId = req.user.id

    // Find active partnership
    const partnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId },
          { partnerId: userId }
        ],
        status: 'active'
      }
    })

    if (isLocked && !partnership) {
      return res.status(400).json({ message: 'Locked capsules require active partnership' })
    }

    const capsule = await prisma.capsule.create({
      data: {
        title,
        content,
        type,
        isLocked,
        createdById: userId,
        partnershipId: partnership?.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        unlockVotes: {
          select: {
            userId: true
          }
        }
      }
    })

    res.status(201).json(formatCapsuleForUser(capsule, userId))
  } catch (error) {
    console.error('Create capsule error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Unlock a capsule
router.put('/capsules/:id/unlock', authenticate, requireCsrf, writeRateLimit, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: {
        partnership: true,
        unlockVotes: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' })
    }

    // Check if user has access to this capsule
    const hasAccess = capsule.createdById === userId ||
      (capsule.partnership && (capsule.partnership.userId === userId || capsule.partnership.partnerId === userId))

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (!capsule.isLocked) {
      return res.json({
        status: 'already_unlocked',
        capsule: formatCapsuleForUser(capsule, userId)
      })
    }

    if (!capsule.partnershipId) {
      return res.status(400).json({ message: 'Locked capsule missing partnership context' })
    }

    const existingVotes = Array.isArray((capsule as any).unlockVotes)
      ? ((capsule as any).unlockVotes as Array<{ userId: string }>)
      : []
    const viewerAlreadyVoted = existingVotes.some((vote: { userId: string }) => vote.userId === userId)

    if (!viewerAlreadyVoted) {
      await prisma.capsuleUnlockVote.upsert({
        where: {
          capsuleId_userId: {
            capsuleId: id,
            userId
          }
        },
        update: {},
        create: {
          capsuleId: id,
          userId
        }
      })
    }

    const unlockVotesCount = await prisma.capsuleUnlockVote.count({
      where: { capsuleId: id }
    })

    const shouldUnlock = unlockVotesCount >= 2

    if (shouldUnlock) {
      await prisma.capsule.update({
        where: { id },
        data: {
          isLocked: false,
          unlockedAt: new Date()
        }
      })
    }

    const updatedCapsule = await prisma.capsule.findUnique({
      where: { id },
      include: {
        partnership: true,
        unlockVotes: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!updatedCapsule) {
      return res.status(404).json({ message: 'Capsule not found' })
    }

    const status = shouldUnlock ? 'unlocked' : (viewerAlreadyVoted ? 'already_voted' : 'awaiting_partner')

    res.json({
      status,
      capsule: formatCapsuleForUser(updatedCapsule, userId)
    })
  } catch (error) {
    console.error('Unlock capsule error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router