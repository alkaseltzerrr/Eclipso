import React, { createContext, useContext, useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { ensureCsrfToken, getCsrfTokenFromCookie } from '../utils/csrf'
import { getApiErrorMessage } from '../utils/api'

interface Message {
  id: string
  senderId: string
  receiverId?: string
  content: string
  timestamp: string
  type: 'text' | 'capsule'
  readAt?: string | null
}

interface PartnerPresence {
  isOnline: boolean
  lastSeenAt: string | null
}

interface SocketContextType {
  socket: Socket | null
  messages: Message[]
  sendMessage: (content: string, type?: 'text' | 'capsule') => void
  markMessagesRead: () => void
  setTyping: (isTyping: boolean) => void
  socketNotice: string | null
  loadOlderMessages: () => Promise<void>
  hasMoreMessages: boolean
  isLoadingMessages: boolean
  isConnected: boolean
  partnerPresence: PartnerPresence | null
  partnerTyping: boolean
}

const SocketContext = createContext<SocketContextType | null>(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [socketNotice, setSocketNotice] = useState<string | null>(null)
  const [partnerPresence, setPartnerPresence] = useState<PartnerPresence | null>(null)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const { user } = useAuth()
  const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin

  const normalizeMessage = (incoming: any): Message => {
    return {
      id: incoming.id,
      senderId: incoming.senderId,
      receiverId: incoming.receiverId,
      content: incoming.content,
      type: incoming.type,
      timestamp: incoming.timestamp || incoming.createdAt || new Date().toISOString(),
      readAt: incoming.readAt || null
    }
  }

  const fetchMessages = async (options: { partnerId: string; cursor?: string; prepend?: boolean }) => {
    const { partnerId, cursor, prepend = false } = options
    const params = new URLSearchParams({
      partnerId,
      limit: '30'
    })

    if (cursor) {
      params.set('cursor', cursor)
    }

    setIsLoadingMessages(true)

    try {
      const response = await fetch(`/api/chat/messages?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to load messages'))
      }

      const data = await response.json()
      const normalizedMessages: Message[] = (data.messages || []).map(normalizeMessage)

      setMessages((prev) => {
        if (!prepend) {
          return normalizedMessages
        }

        const existingIds = new Set(prev.map((msg) => msg.id))
        const olderMessages = normalizedMessages.filter((msg) => !existingIds.has(msg.id))
        return [...olderMessages, ...prev]
      })

      setNextCursor(data.nextCursor || null)
      setHasMoreMessages(Boolean(data.hasMore))
    } catch (error) {
      console.error('Failed to load message history:', error)
      setSocketNotice(error instanceof Error ? error.message : 'Failed to load chat history.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    let socketInstance: Socket | null = null

    const connectSocket = async () => {
      if (!user) {
        setSocket(null)
        setIsConnected(false)
        setMessages([])
        setNextCursor(null)
        setHasMoreMessages(false)
        setSocketNotice(null)
        setPartnerPresence(null)
        setPartnerTyping(false)
        return
      }

      await ensureCsrfToken()

      socketInstance = io(socketUrl, {
        withCredentials: true,
        auth: (callback) => {
          callback({
            csrfToken: getCsrfTokenFromCookie()
          })
        }
      })

      socketInstance.on('connect', () => {
        setIsConnected(true)
        setSocketNotice(null)

        if (user.partnerId) {
          socketInstance?.emit('joinPartnerRoom', {
            partnerId: user.partnerId,
            csrfToken: getCsrfTokenFromCookie()
          })
        }

        console.log('Connected to server')
      })

      socketInstance.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from server')
      })

      socketInstance.on('message', (message: Message) => {
        const normalizedMessage = normalizeMessage(message)

        setMessages((prev) => {
          if (prev.some((existing) => existing.id === normalizedMessage.id)) {
            return prev
          }

          return [...prev, normalizedMessage]
        })
      })

      socketInstance.on('messagesRead', (payload: { senderId?: string; readAt?: string }) => {
        if (!payload.senderId || !payload.readAt) {
          return
        }

        setMessages((prev) => prev.map((msg) => {
          if (msg.senderId === payload.senderId && !msg.readAt) {
            return {
              ...msg,
              readAt: payload.readAt
            }
          }

          return msg
        }))
      })

      socketInstance.on('presenceUpdate', (payload: { userId?: string; isOnline?: boolean; lastSeenAt?: string | null }) => {
        if (!user.partnerId || payload.userId !== user.partnerId) {
          return
        }

        setPartnerPresence({
          isOnline: Boolean(payload.isOnline),
          lastSeenAt: payload.lastSeenAt || null
        })
      })

      socketInstance.on('partnerTyping', (payload: { userId?: string; isTyping?: boolean }) => {
        if (!user.partnerId || payload.userId !== user.partnerId) {
          return
        }

        setPartnerTyping(Boolean(payload.isTyping))
      })

      socketInstance.on('errorMessage', (payload: { code?: string; message?: string }) => {
        if (payload?.code === 'csrf_mismatch') {
          setSocketNotice('Session check failed. Reconnecting...')
          socketInstance?.disconnect()
          socketInstance?.connect()
          return
        }

        setSocketNotice(payload?.message || 'Socket error occurred')
        console.error('Socket error:', payload?.message || 'Unknown socket error')
      })

      setSocket(socketInstance)
    }

    if (user) {
      connectSocket()

      return () => {
        socketInstance?.close()
      }
    }

    setSocket(null)
    setIsConnected(false)
    setMessages([])
    setNextCursor(null)
    setHasMoreMessages(false)
    setSocketNotice(null)
    setPartnerPresence(null)
    setPartnerTyping(false)
  }, [user, socketUrl])

  useEffect(() => {
    if (!user?.partnerId) {
      setMessages([])
      setNextCursor(null)
      setHasMoreMessages(false)
      setSocketNotice(null)
      setPartnerPresence(null)
      setPartnerTyping(false)
      return
    }

    fetchMessages({ partnerId: user.partnerId })
  }, [user?.id, user?.partnerId])

  const loadOlderMessages = async () => {
    if (!user?.partnerId || !nextCursor || isLoadingMessages) {
      return
    }

    await fetchMessages({
      partnerId: user.partnerId,
      cursor: nextCursor,
      prepend: true
    })
  }

  const sendMessage = (content: string, type: 'text' | 'capsule' = 'text') => {
    if (socket && user) {
      if (!user.partnerId) {
        return
      }

      const message = {
        content,
        type,
        senderId: user.id,
        partnerId: user.partnerId,
        csrfToken: getCsrfTokenFromCookie()
      }
      socket.emit('message', message)
    }
  }

  const markMessagesRead = () => {
    if (!socket || !user?.partnerId) {
      return
    }

    socket.emit('markRead', {
      partnerId: user.partnerId,
      csrfToken: getCsrfTokenFromCookie()
    })
  }

  const setTyping = (isTyping: boolean) => {
    if (!socket || !user?.partnerId || !isConnected) {
      return
    }

    socket.emit(isTyping ? 'typing' : 'stopTyping', {
      partnerId: user.partnerId,
      csrfToken: getCsrfTokenFromCookie()
    })
  }

  useEffect(() => {
    if (!user?.partnerId || !socket || !isConnected) {
      return
    }

    const hasUnreadIncoming = messages.some((msg) => msg.senderId === user.partnerId && !msg.readAt)

    if (!hasUnreadIncoming) {
      return
    }

    markMessagesRead()
  }, [messages, user?.partnerId, socket, isConnected])

  useEffect(() => {
    if (!socketNotice) {
      return
    }

    const timeout = window.setTimeout(() => {
      setSocketNotice(null)
    }, 4000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [socketNotice])

  return (
    <SocketContext.Provider value={{
      socket,
      messages,
      sendMessage,
      markMessagesRead,
      setTyping,
      socketNotice,
      loadOlderMessages,
      hasMoreMessages,
      isLoadingMessages,
      isConnected,
      partnerPresence,
      partnerTyping,
    }}>
      {children}
    </SocketContext.Provider>
  )
}