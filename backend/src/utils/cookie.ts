export const parseCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return {}
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf('=')

      if (separatorIndex <= 0) {
        return acc
      }

      const key = part.slice(0, separatorIndex).trim()
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim())

      acc[key] = value
      return acc
    }, {})
}