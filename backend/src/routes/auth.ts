import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      }
    })

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    res.status(201).json({
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        interests: {
          include: {
            interest: true
          }
        }
      }
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Prepare user data
    const userInterests = user.interests.map((ui: any) => ui.interest.name)
    const { password: _, interests: __, ...userWithoutPassword } = user

    res.json({
      token,
      user: {
        ...userWithoutPassword,
        interests: userInterests
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.header('Authorization')
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Access denied' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        interests: {
          include: {
            interest: true
          }
        },
        partnerships: {
          include: {
            partner: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userInterests = user.interests.map((ui: any) => ui.interest.name)
    const activePartnership = user.partnerships.find((p: any) => p.status === 'active')
    
    const { password: _, interests: __, partnerships: ___, ...userWithoutPassword } = user

    res.json({
      ...userWithoutPassword,
      interests: userInterests,
      partnerId: activePartnership?.partnerId
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router