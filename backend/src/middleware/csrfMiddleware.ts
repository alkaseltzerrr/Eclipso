import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'
import { parseCookieHeader } from '../utils/cookie'

export const CSRF_COOKIE_NAME = 'csrf_token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const getCsrfCookieOptions = () => {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  }
}

export const issueCsrfToken = (res: Response) => {
  const token = crypto.randomBytes(24).toString('hex')
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions())
  return token
}

export const clearCsrfToken = (res: Response) => {
  const options = getCsrfCookieOptions()

  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path
  })
}

export const requireCsrf = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next()
  }

  const cookies = parseCookieHeader(req.header('Cookie'))
  const csrfCookie = cookies[CSRF_COOKIE_NAME]
  const csrfHeader = req.header(CSRF_HEADER_NAME)

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'Invalid CSRF token' })
  }

  next()
}