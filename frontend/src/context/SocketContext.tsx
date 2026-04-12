import React, { createContext, useContext, useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface Message {
  id: string
  senderId: string
  receiverId?: string
  content: string
  timestamp: string
  type: 'text' | 'capsule'
}

interface SocketContextType {
  socket: Socket | null
  messages: Message[]
  sendMessage: (content: string, type?: 'text' | 'capsule') => void
  loadOlderMessages: () => Promise<void>
  hasMoreMessages: boolean
  isLoadingMessages: boolean
  isConnected: boolean
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
  const { user } = useAuth()
  const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin

  const normalizeMessage = (incoming: any): Message => {
    return {
      id: incoming.id,
      senderId: incoming.senderId,
      receiverId: incoming.receiverId,
      content: incoming.content,
      type: incoming.type,
      timestamp: incoming.timestamp || incoming.createdAt || new Date().toISOString()
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
        throw new Error('Failed to load messages')
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
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (user) {
      const socketInstance = io(socketUrl, {
        withCredentials: true
      })

      socketInstance.on('connect', () => {
        setIsConnected(true)

        if (user.partnerId) {
          socketInstance.emit('joinPartnerRoom', user.partnerId)
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

      socketInstance.on('errorMessage', (payload: { message?: string }) => {
        console.error('Socket error:', payload?.message || 'Unknown socket error')
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.close()
      }
    }

    setSocket(null)
    setIsConnected(false)
    setMessages([])
    setNextCursor(null)
    setHasMoreMessages(false)
  }, [user, socketUrl])

  useEffect(() => {
    if (!user?.partnerId) {
      setMessages([])
      setNextCursor(null)
      setHasMoreMessages(false)
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
      }
      socket.emit('message', message)
    }
  }

  return (
    <SocketContext.Provider value={{
      socket,
      messages,
      sendMessage,
      loadOlderMessages,
      hasMoreMessages,
      isLoadingMessages,
      isConnected,
    }}>
      {children}
    </SocketContext.Provider>
  )
}