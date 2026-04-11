import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'

const router = express.Router()
const prisma = new PrismaClient()

// Get chat messages
router.get('/messages', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const { partnerId } = req.query

    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID required' })
    }

    // Find messages between users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId as string },
          { senderId: partnerId as string, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 50 // Limit to last 50 messages
    })

    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a new message
router.post('/messages', authenticate, async (req: any, res: any) => {
  try {
    const { content, receiverId, type = 'text' } = req.body
    const senderId = req.user.id

    const message = await prisma.message.create({
      data: {
        content,
        type,
        senderId,
        receiverId
      }
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('Create message error:', error)
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(capsules)
  } catch (error) {
    console.error('Get capsules error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a new capsule
router.post('/capsules', authenticate, async (req: any, res: any) => {
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
        }
      }
    })

    res.status(201).json(capsule)
  } catch (error) {
    console.error('Create capsule error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Unlock a capsule
router.put('/capsules/:id/unlock', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: {
        partnership: true
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

    const unlockedCapsule = await prisma.capsule.update({
      where: { id },
      data: {
        isLocked: false,
        unlockedAt: new Date()
      }
    })

    res.json(unlockedCapsule)
  } catch (error) {
    console.error('Unlock capsule error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router