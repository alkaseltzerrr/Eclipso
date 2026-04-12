import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import chatRoutes from './routes/chat'

import { authenticateSocket } from './middleware/authMiddleware'
import prisma from './lib/prisma'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
})

const PORT = process.env.PORT || 5000

const onlineUsers = new Map<string, { connections: number; lastSeenAt: string | null }>()

const markUserConnected = (userId: string) => {
  const current = onlineUsers.get(userId)

  if (!current) {
    onlineUsers.set(userId, {
      connections: 1,
      lastSeenAt: null
    })
    return
  }

  onlineUsers.set(userId, {
    connections: current.connections + 1,
    lastSeenAt: null
  })
}

const markUserDisconnected = (userId: string) => {
  const current = onlineUsers.get(userId)

  if (!current) {
    return {
      isOnline: false,
      lastSeenAt: new Date().toISOString()
    }
  }

  const remainingConnections = current.connections - 1

  if (remainingConnections > 0) {
    onlineUsers.set(userId, {
      connections: remainingConnections,
      lastSeenAt: null
    })

    return {
      isOnline: true,
      lastSeenAt: null
    }
  }

  const lastSeenAt = new Date().toISOString()

  onlineUsers.set(userId, {
    connections: 0,
    lastSeenAt
  })

  return {
    isOnline: false,
    lastSeenAt
  }
}

const getPresence = (userId: string) => {
  const current = onlineUsers.get(userId)

  if (!current || current.connections <= 0) {
    return {
      isOnline: false,
      lastSeenAt: current?.lastSeenAt || null
    }
  }

  return {
    isOnline: true,
    lastSeenAt: null
  }
}

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Socket.IO
io.use(authenticateSocket)

io.on('connection', (socket) => {
  const userId = socket.data.userId
  const socketEventHits = new Map<string, { count: number; resetAt: number }>()

  markUserConnected(userId)

  const hasValidSocketCsrf = (payload: any) => {
    const expectedToken = socket.data.csrfToken as string | undefined

    if (!expectedToken) {
      return true
    }

    if (!payload || typeof payload !== 'object') {
      return false
    }

    return payload.csrfToken === expectedToken
  }

  const hasActivePartnership = async (partnerId: string) => {
    const partnership = await prisma.partnership.findFirst({
      where: {
        status: 'active',
        OR: [
          { userId, partnerId },
          { userId: partnerId, partnerId: userId }
        ]
      }
    })

    return partnership
  }

  const buildRoomId = (peerId: string) => {
    return [userId, peerId].sort().join(':')
  }

  const isSocketEventAllowed = (eventName: string, max: number, windowMs: number) => {
    const now = Date.now()
    const current = socketEventHits.get(eventName)

    if (!current || current.resetAt <= now) {
      socketEventHits.set(eventName, {
        count: 1,
        resetAt: now + windowMs
      })
      return true
    }

    current.count += 1

    return current.count <= max
  }

  const emitPresenceToRoom = (roomName: string, targetUserId: string) => {
    const presence = getPresence(targetUserId)

    io.to(roomName).emit('presenceUpdate', {
      userId: targetUserId,
      isOnline: presence.isOnline,
      lastSeenAt: presence.lastSeenAt
    })
  }

  const emitPresenceToSocket = (targetSocket: typeof socket, targetUserId: string) => {
    const presence = getPresence(targetUserId)

    targetSocket.emit('presenceUpdate', {
      userId: targetUserId,
      isOnline: presence.isOnline,
      lastSeenAt: presence.lastSeenAt
    })
  }

  console.log(`User ${userId} connected`)

  // Join user to their personal room
  socket.join(`user:${userId}`)

  // Handle joining partner room if they have a partner
  socket.on('joinPartnerRoom', async (payload: any) => {
    if (!hasValidSocketCsrf(payload)) {
      socket.emit('errorMessage', {
        code: 'csrf_mismatch',
        message: 'Invalid CSRF token for socket event'
      })
      return
    }

    const partnerId = typeof payload === 'string' ? payload : payload?.partnerId

    if (!partnerId || typeof partnerId !== 'string') {
      return
    }

    const activePartnership = await hasActivePartnership(partnerId)

    if (!activePartnership) {
      socket.emit('errorMessage', { message: 'No active partnership with this user' })
      return
    }

    const roomId = buildRoomId(partnerId)
    const roomName = `room:${roomId}`
    socket.join(roomName)

    emitPresenceToSocket(socket, partnerId)
    emitPresenceToRoom(roomName, userId)

    console.log(`User ${userId} joined room with partner ${partnerId}`)
  })

  // Handle chat messages
  socket.on('message', async (data) => {
    try {
      if (!hasValidSocketCsrf(data)) {
        socket.emit('errorMessage', {
          code: 'csrf_mismatch',
          message: 'Invalid CSRF token for socket event'
        })
        return
      }

      if (!isSocketEventAllowed('message', 25, 10 * 1000)) {
        socket.emit('errorMessage', {
          code: 'rate_limited',
          message: 'Too many messages. Slow down.'
        })
        return
      }

      const { content, partnerId, type = 'text' } = data

      if (!partnerId || typeof partnerId !== 'string') {
        socket.emit('errorMessage', { message: 'Partner room required' })
        return
      }

      const normalizedContent = String(content || '').trim()

      if (!normalizedContent) {
        socket.emit('errorMessage', { message: 'Message content required' })
        return
      }

      const activePartnership = await hasActivePartnership(partnerId)

      if (!activePartnership) {
        socket.emit('errorMessage', { message: 'No active partnership with this user' })
        return
      }

      const roomId = buildRoomId(partnerId)
      const roomName = `room:${roomId}`

      // Ensure sender joined proper partner room before broadcasting
      if (!socket.rooms.has(roomName)) {
        socket.join(roomName)
      }
      
      const message = await prisma.message.create({
        data: {
          content: normalizedContent,
          type,
          senderId: userId,
          receiverId: partnerId,
          partnershipId: activePartnership.id
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          readAt: true
        }
      })

      const messagePayload = {
        id: message.id,
        senderId: userId,
        receiverId: partnerId,
        content: message.content,
        type,
        timestamp: message.createdAt.toISOString(),
        readAt: null
      }

      // Emit only to shared partner room (sender + partner)
      io.to(roomName).emit('message', messagePayload)
      
      console.log(`Message from ${userId}: ${message.content}`)
    } catch (error) {
      console.error('Error handling message:', error)
    }
  })

  socket.on('markRead', async (data) => {
    try {
      if (!hasValidSocketCsrf(data)) {
        socket.emit('errorMessage', {
          code: 'csrf_mismatch',
          message: 'Invalid CSRF token for socket event'
        })
        return
      }

      if (!isSocketEventAllowed('markRead', 20, 10 * 1000)) {
        socket.emit('errorMessage', {
          code: 'rate_limited',
          message: 'Too many read updates. Slow down.'
        })
        return
      }

      const partnerId = data?.partnerId

      if (!partnerId || typeof partnerId !== 'string') {
        return
      }

      const activePartnership = await hasActivePartnership(partnerId)

      if (!activePartnership) {
        socket.emit('errorMessage', { message: 'No active partnership with this user' })
        return
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

      if (updated.count === 0) {
        return
      }

      const roomName = `room:${buildRoomId(partnerId)}`

      io.to(roomName).emit('messagesRead', {
        readerId: userId,
        senderId: partnerId,
        readAt: readAt.toISOString()
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  })

  socket.on('typing', async (data) => {
    try {
      if (!hasValidSocketCsrf(data)) {
        socket.emit('errorMessage', {
          code: 'csrf_mismatch',
          message: 'Invalid CSRF token for socket event'
        })
        return
      }

      if (!isSocketEventAllowed('typing', 60, 10 * 1000)) {
        socket.emit('errorMessage', {
          code: 'rate_limited',
          message: 'Too many typing events. Slow down.'
        })
        return
      }

      const partnerId = data?.partnerId

      if (!partnerId || typeof partnerId !== 'string') {
        return
      }

      const activePartnership = await hasActivePartnership(partnerId)

      if (!activePartnership) {
        socket.emit('errorMessage', { message: 'No active partnership with this user' })
        return
      }

      const roomName = `room:${buildRoomId(partnerId)}`

      io.to(roomName).emit('partnerTyping', {
        userId,
        isTyping: true
      })
    } catch (error) {
      console.error('Error handling typing start:', error)
    }
  })

  socket.on('stopTyping', async (data) => {
    try {
      if (!hasValidSocketCsrf(data)) {
        socket.emit('errorMessage', {
          code: 'csrf_mismatch',
          message: 'Invalid CSRF token for socket event'
        })
        return
      }

      if (!isSocketEventAllowed('typing', 60, 10 * 1000)) {
        socket.emit('errorMessage', {
          code: 'rate_limited',
          message: 'Too many typing events. Slow down.'
        })
        return
      }

      const partnerId = data?.partnerId

      if (!partnerId || typeof partnerId !== 'string') {
        return
      }

      const activePartnership = await hasActivePartnership(partnerId)

      if (!activePartnership) {
        socket.emit('errorMessage', { message: 'No active partnership with this user' })
        return
      }

      const roomName = `room:${buildRoomId(partnerId)}`

      io.to(roomName).emit('partnerTyping', {
        userId,
        isTyping: false
      })
    } catch (error) {
      console.error('Error handling typing stop:', error)
    }
  })

  // Handle constellation updates
  socket.on('updateConstellation', (data) => {
    socket.broadcast.emit('constellationUpdate', data)
  })

  // Handle orbit level updates
  socket.on('updateOrbit', (data) => {
    socket.broadcast.emit('orbitUpdate', data)
  })

  socket.on('disconnect', () => {
    const presence = markUserDisconnected(userId)

    if (!presence.isOnline) {
      const partnerRooms = Array.from(socket.rooms).filter((roomName) => roomName.startsWith('room:'))

      for (const roomName of partnerRooms) {
        io.to(roomName).emit('presenceUpdate', {
          userId,
          isOnline: false,
          lastSeenAt: presence.lastSeenAt
        })
      }
    }

    console.log(`User ${userId} disconnected`)
  })
})

server.listen(PORT, () => {
  console.log(`🛰️  Eclipso server running on port ${PORT}`)
  console.log(`🌌 Environment: ${process.env.NODE_ENV}`)
})