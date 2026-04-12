import { NextFunction, Request, Response } from 'express'

type RateLimitOptions = {
  windowMs: number
  max: number
  message: string
}

type HitState = {
  count: number
  resetAt: number
}

const createRateLimiter = ({ windowMs, max, message }: RateLimitOptions) => {
  const hits = new Map<string, HitState>()

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = req.ip || 'unknown'

    const current = hits.get(key)

    if (!current || current.resetAt <= now) {
      hits.set(key, {
        count: 1,
        resetAt: now + windowMs
      })
      return next()
    }

    current.count += 1

    if (current.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({
        message,
        retryAfterSeconds
      })
    }

    next()
  }
}

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Try again later.'
})

export const csrfRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many CSRF token requests. Try again later.'
})

export const writeRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many write requests. Slow down.'
})

export const partnershipActionRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many partnership actions. Try again shortly.'
})
