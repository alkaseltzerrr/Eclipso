type ApiErrorPayload = {
  message?: string
  retryAfterSeconds?: number
}

const toSafeNumber = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.max(1, Math.floor(value))
}

export const getApiErrorMessage = async (response: Response, fallback: string) => {
  let payload: ApiErrorPayload | null = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const payloadMessage = typeof payload?.message === 'string' ? payload.message : null
  const retryAfterFromBody = toSafeNumber(payload?.retryAfterSeconds)
  const retryAfterFromHeader = toSafeNumber(Number(response.headers.get('Retry-After')))
  const retryAfterSeconds = retryAfterFromBody || retryAfterFromHeader

  if (response.status === 429) {
    if (retryAfterSeconds) {
      return `${payloadMessage || 'Too many requests.'} Try again in ${retryAfterSeconds}s.`
    }

    return payloadMessage || 'Too many requests. Try again soon.'
  }

  return payloadMessage || fallback
}
