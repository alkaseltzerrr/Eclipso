const CSRF_COOKIE_NAME = 'csrf_token'

const parseCookie = (name: string) => {
  const prefix = `${name}=`
  const cookieParts = document.cookie.split(';').map((part) => part.trim())
  const match = cookieParts.find((part) => part.startsWith(prefix))

  if (!match) {
    return null
  }

  return decodeURIComponent(match.slice(prefix.length))
}

export const getCsrfTokenFromCookie = () => {
  return parseCookie(CSRF_COOKIE_NAME)
}

export const ensureCsrfToken = async () => {
  const existingToken = getCsrfTokenFromCookie()

  if (existingToken) {
    return existingToken
  }

  try {
    const response = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }

    const data = await response.json()
    return data.csrfToken || getCsrfTokenFromCookie()
  } catch (error) {
    console.error('CSRF bootstrap failed:', error)
    return null
  }
}

export const withCsrfHeader = async (headers: Record<string, string> = {}) => {
  const csrfToken = await ensureCsrfToken()

  if (!csrfToken) {
    return headers
  }

  return {
    ...headers,
    'X-CSRF-Token': csrfToken
  }
}