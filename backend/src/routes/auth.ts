import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import prisma from '../lib/prisma'
import { AUTH_COOKIE_NAME, authenticate } from '../middleware/authMiddleware'
import { clearCsrfToken, issueCsrfToken, requireCsrf } from '../middleware/csrfMiddleware'

const router = express.Router()
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const getAuthCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/'
  }
}

const setAuthCookie = (res: express.Response, token: string) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions())
}

const clearAuthCookie = (res: express.Response) => {
  const options = getAuthCookieOptions()
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path
  })
}

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  username: Joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
  password: Joi.string().min(8).max(128).required()
})

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().min(8).max(128).required()
})

const getValidationMessage = (error: Joi.ValidationError) => {
  return error.details[0]?.message || 'Invalid request payload'
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const email = value.email as string
    const username = value.username.trim() as string
    const password = value.password as string

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

    setAuthCookie(res, token)
    const csrfToken = issueCsrfToken(res)

    res.status(201).json({
      csrfToken,
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
    const { value, error } = loginSchema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({ message: getValidationMessage(error) })
    }

    const email = value.email as string
    const password = value.password as string

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

    const activePartnership = await prisma.partnership.findFirst({
      where: {
        status: 'active',
        OR: [
          { userId: user.id },
          { partnerId: user.id }
        ]
      }
    })

    const partnerId = activePartnership
      ? (activePartnership.userId === user.id ? activePartnership.partnerId : activePartnership.userId)
      : undefined

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Prepare user data
    const userInterests = user.interests.map((ui: any) => ui.interest.name)
    const { password: _, interests: __, ...userWithoutPassword } = user

    setAuthCookie(res, token)
    const csrfToken = issueCsrfToken(res)

    res.json({
      csrfToken,
      user: {
        ...userWithoutPassword,
        interests: userInterests,
        partnerId
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        interests: {
          include: {
            interest: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userInterests = user.interests.map((ui: any) => ui.interest.name)
    const activePartnership = await prisma.partnership.findFirst({
      where: {
        status: 'active',
        OR: [
          { userId: user.id },
          { partnerId: user.id }
        ]
      }
    })

    const partnerId = activePartnership
      ? (activePartnership.userId === user.id ? activePartnership.partnerId : activePartnership.userId)
      : undefined

    const { password: _, interests: __, ...userWithoutPassword } = user

    res.json({
      ...userWithoutPassword,
      interests: userInterests,
      partnerId
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/csrf', (req, res) => {
  const csrfToken = issueCsrfToken(res)
  res.json({ csrfToken })
})

router.post('/logout', requireCsrf, (req, res) => {
  clearAuthCookie(res)
  clearCsrfToken(res)
  res.status(204).send()
})

export default router