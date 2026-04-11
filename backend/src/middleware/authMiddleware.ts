import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { Socket } from 'socket.io'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization')
  const token = authHeader && authHeader.split(' ')[1]

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
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error('Authentication error'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    socket.data.userId = decoded.id
    socket.data.user = decoded
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
}