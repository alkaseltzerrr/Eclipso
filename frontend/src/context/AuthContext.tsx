import React, { createContext, useContext, useEffect, useState } from 'react'
import { ensureCsrfToken, withCsrfHeader } from '../utils/csrf'

interface User {
  id: string
  email: string
  username: string
  avatar?: string
  isOnboarded: boolean
  interests: string[]
  partnerId?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      await ensureCsrfToken()
      await fetchUser()
    }

    bootstrapAuth()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const csrfHeaders = await withCsrfHeader({
      'Content-Type': 'application/json'
    })

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: csrfHeaders,
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const { user: userData } = await response.json()
    setUser(userData)
  }

  const register = async (email: string, password: string, username: string) => {
    const csrfHeaders = await withCsrfHeader({
      'Content-Type': 'application/json'
    })

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: csrfHeaders,
      body: JSON.stringify({ email, password, username }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const { user: userData } = await response.json()
    setUser(userData)
  }

  const logout = async () => {
    try {
      const csrfHeaders = await withCsrfHeader()

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }

    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    const csrfHeaders = await withCsrfHeader({
      'Content-Type': 'application/json'
    })

    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: csrfHeaders,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Profile update failed')
    }

    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshUser: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}