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

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 5000

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

  const buildRoomId = (peerId: string) => {
    return [userId, peerId].sort().join(':')
  }

  console.log(`User ${userId} connected`)

  // Join user to their personal room
  socket.join(`user:${userId}`)

  // Handle joining partner room if they have a partner
  socket.on('joinPartnerRoom', (partnerId: string) => {
    if (!partnerId || typeof partnerId !== 'string') {
      return
    }

    const roomId = buildRoomId(partnerId)
    socket.join(`room:${roomId}`)
    console.log(`User ${userId} joined room with partner ${partnerId}`)
  })

  // Handle chat messages
  socket.on('message', async (data) => {
    try {
      const { content, partnerId, type = 'text' } = data

      if (!partnerId || typeof partnerId !== 'string') {
        socket.emit('errorMessage', { message: 'Partner room required' })
        return
      }

      const roomId = buildRoomId(partnerId)
      const roomName = `room:${roomId}`

      // Ensure sender joined proper partner room before broadcasting
      if (!socket.rooms.has(roomName)) {
        socket.join(roomName)
      }
      
      // Here you would save the message to the database
      const message = {
        id: Date.now().toString(),
        senderId: userId,
        receiverId: partnerId,
        content,
        type,
        timestamp: new Date().toISOString()
      }

      // Emit only to shared partner room (sender + partner)
      io.to(roomName).emit('message', message)
      
      console.log(`Message from ${userId}: ${content}`)
    } catch (error) {
      console.error('Error handling message:', error)
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
    console.log(`User ${userId} disconnected`)
  })
})

server.listen(PORT, () => {
  console.log(`🛰️  Eclipso server running on port ${PORT}`)
  console.log(`🌌 Environment: ${process.env.NODE_ENV}`)
})