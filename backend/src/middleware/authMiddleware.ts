import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { Socket } from 'socket.io'
import { CSRF_COOKIE_NAME } from './csrfMiddleware'
import { parseCookieHeader } from '../utils/cookie'

export const AUTH_COOKIE_NAME = 'auth_token'

export const extractTokenFromRequest = (req: Request) => {
  const authHeader = req.header('Authorization')
  const headerToken = authHeader && authHeader.split(' ')[1]

  if (headerToken) {
    return headerToken
  }

  const cookies = parseCookieHeader(req.header('Cookie'))
  return cookies[AUTH_COOKIE_NAME]
}

const extractTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token

  if (authToken && typeof authToken === 'string') {
    return authToken
  }

  const cookies = parseCookieHeader(socket.handshake.headers.cookie)
  return cookies[AUTH_COOKIE_NAME]
}

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = decoded
    next()
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' })
  }
}

export const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const cookies = parseCookieHeader(socket.handshake.headers.cookie)
  const token = extractTokenFromSocket(socket)
  let validatedCsrfToken: string | undefined

  if (!token) {
    return next(new Error('Authentication error'))
  }

  // Enforce CSRF proof for cookie-based socket auth
  if (cookies[AUTH_COOKIE_NAME]) {
    const csrfCookie = cookies[CSRF_COOKIE_NAME]
    const csrfToken = socket.handshake.auth?.csrfToken

    if (!csrfCookie || !csrfToken || csrfCookie !== csrfToken) {
      return next(new Error('CSRF validation failed'))
    }

    validatedCsrfToken = csrfCookie
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    socket.data.userId = decoded.id
    socket.data.user = decoded
    socket.data.csrfToken = validatedCsrfToken
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
}