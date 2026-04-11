import React, { useState, useRef, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Chat: React.FC = () => {
  const [message, setMessage] = useState('')
  const { messages, sendMessage, isConnected } = useSocket()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const canSend = isConnected && Boolean(user?.partnerId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && canSend) {
      sendMessage(message)
      setMessage('')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="h-full flex flex-col bg-eclipse-black/60 backdrop-blur-sm rounded-xl border border-aurora-purple/20">
      {/* Chat Header */}
      <div className="p-4 border-b border-aurora-purple/20">
        <div className="flex items-center justify-between">
          <h2 className="font-orbitron text-xl text-starlight-cyan">
            Cosmic Messages
          </h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-sm text-aurora-purple/80">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                msg.senderId === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative ${
                  msg.senderId === user?.id
                    ? 'bg-gradient-to-r from-aurora-purple to-nebula-rose text-white message-comet'
                    : 'bg-deep-space/50 text-starlight-cyan border border-aurora-purple/30'
                }`}
              >
                {msg.type === 'capsule' && (
                  <div className="flex items-center mb-2">
                    <Sparkles className="w-4 h-4 mr-2 text-solar-gold" />
                    <span className="text-xs font-medium text-solar-gold">
                      Capsule Message
                    </span>
                  </div>
                )}
                <p className="text-sm font-inter">{msg.content}</p>
                <div className="text-xs opacity-70 mt-1">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-aurora-purple/20">
        <div className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={user?.partnerId ? 'Send a cosmic message...' : 'Link with partner to start chat'}
            className="flex-1 px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple"
            disabled={!canSend}
          />
          <button
            type="submit"
            disabled={!message.trim() || !canSend}
            className="px-4 py-3 bg-gradient-to-r from-aurora-purple to-nebula-rose text-white rounded-lg hover:from-aurora-purple/80 hover:to-nebula-rose/80 focus:outline-none focus:ring-2 focus:ring-aurora-purple disabled:opacity-50 transition-all duration-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chat