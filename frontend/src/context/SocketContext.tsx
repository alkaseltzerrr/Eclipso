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
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      const socketInstance = io('http://localhost:5000', {
        auth: {
          token,
        },
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
        setMessages((prev) => [...prev, message])
      })

      socketInstance.on('messageHistory', (history: Message[]) => {
        setMessages(history)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.close()
      }
    }
  }, [user])

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
      isConnected,
    }}>
      {children}
    </SocketContext.Provider>
  )
}