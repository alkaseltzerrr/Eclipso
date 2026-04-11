import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Heart, Image, Mic, FileText, X } from 'lucide-react'

interface CapsuleData {
  id: string
  title: string
  content: string
  type: 'text' | 'image' | 'audio'
  createdAt: string
  isLocked: boolean
}

const Capsule: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view')
  const [newCapsule, setNewCapsule] = useState({
    title: '',
    content: '',
    type: 'text' as const
  })

  // Mock capsules data
  const capsules: CapsuleData[] = [
    {
      id: '1',
      title: 'First Memory',
      content: 'Remember when we first connected? The stars aligned perfectly that night.',
      type: 'text',
      createdAt: '2024-01-15',
      isLocked: false
    },
    {
      id: '2',
      title: 'Locked Surprise',
      content: 'This memory is waiting for both of us to unlock together...',
      type: 'text',
      createdAt: '2024-01-20',
      isLocked: true
    }
  ]

  const handleCreateCapsule = () => {
    // In a real app, this would send to the backend
    console.log('Creating capsule:', newCapsule)
    setNewCapsule({ title: '', content: '', type: 'text' })
    setActiveTab('view')
  }

  return (
    <>
      <div className="bg-eclipse-black/60 backdrop-blur-sm rounded-xl border border-aurora-purple/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-solar-gold" />
            <h3 className="font-orbitron text-xl text-starlight-cyan">
              Memory Capsules
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-aurora-purple to-nebula-rose text-white text-sm rounded-lg hover:from-aurora-purple/80 hover:to-nebula-rose/80 transition-all duration-300"
          >
            Open Capsules
          </button>
        </div>

        <div className="space-y-3">
          {capsules.slice(0, 2).map((capsule) => (
            <div
              key={capsule.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                capsule.isLocked
                  ? 'border-solar-gold/30 bg-solar-gold/5 hover:border-solar-gold/50'
                  : 'border-aurora-purple/30 bg-aurora-purple/5 hover:border-aurora-purple/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-starlight-cyan text-sm">
                    {capsule.title}
                  </h4>
                  <p className="text-xs text-aurora-purple/60 mt-1">
                    {new Date(capsule.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {capsule.isLocked && (
                    <div className="w-2 h-2 bg-solar-gold rounded-full animate-pulse-glow" />
                  )}
                  <div className={`w-2 h-2 rounded-full ${
                    capsule.isLocked ? 'bg-solar-gold/50' : 'bg-aurora-purple'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-eclipse-black/90 backdrop-blur-md rounded-2xl border border-aurora-purple/30 w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-aurora-purple/20">
                <h2 className="font-orbitron text-2xl text-starlight-cyan">
                  Memory Capsules
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-aurora-purple hover:text-starlight-cyan transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-aurora-purple/20">
                <button
                  onClick={() => setActiveTab('view')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'view'
                      ? 'text-starlight-cyan border-b-2 border-aurora-purple'
                      : 'text-aurora-purple hover:text-starlight-cyan'
                  }`}
                >
                  View Capsules
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'text-starlight-cyan border-b-2 border-aurora-purple'
                      : 'text-aurora-purple hover:text-starlight-cyan'
                  }`}
                >
                  Create Capsule
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {activeTab === 'view' && (
                  <div className="space-y-4">
                    {capsules.map((capsule) => (
                      <div
                        key={capsule.id}
                        className={`p-4 rounded-lg border ${
                          capsule.isLocked
                            ? 'border-solar-gold/30 bg-solar-gold/5'
                            : 'border-aurora-purple/30 bg-aurora-purple/5'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-orbitron text-lg text-starlight-cyan">
                              {capsule.title}
                            </h3>
                            <p className="text-sm text-aurora-purple/60">
                              {new Date(capsule.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {capsule.isLocked && (
                            <div className="flex items-center space-x-1 text-solar-gold">
                              <Heart className="w-4 h-4" />
                              <span className="text-xs">Locked</span>
                            </div>
                          )}
                        </div>
                        <p className="text-starlight-cyan/80">
                          {capsule.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'create' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-starlight-cyan text-sm font-medium mb-2">
                        Capsule Title
                      </label>
                      <input
                        type="text"
                        value={newCapsule.title}
                        onChange={(e) => setNewCapsule({...newCapsule, title: e.target.value})}
                        className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple"
                        placeholder="Give your memory a name..."
                      />
                    </div>

                    <div>
                      <label className="block text-starlight-cyan text-sm font-medium mb-2">
                        Content Type
                      </label>
                      <div className="flex space-x-2">
                        {[
                          { type: 'text', icon: FileText, label: 'Text' },
                          { type: 'image', icon: Image, label: 'Image' },
                          { type: 'audio', icon: Mic, label: 'Audio' }
                        ].map((option) => {
                          const Icon = option.icon
                          return (
                            <button
                              key={option.type}
                              onClick={() => setNewCapsule({...newCapsule, type: option.type as any})}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                                newCapsule.type === option.type
                                  ? 'border-aurora-purple bg-aurora-purple/20 text-starlight-cyan'
                                  : 'border-aurora-purple/30 text-aurora-purple hover:border-aurora-purple/60'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{option.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-starlight-cyan text-sm font-medium mb-2">
                        Memory Content
                      </label>
                      <textarea
                        value={newCapsule.content}
                        onChange={(e) => setNewCapsule({...newCapsule, content: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple resize-none"
                        placeholder="Capture this moment in words..."
                      />
                    </div>

                    <button
                      onClick={handleCreateCapsule}
                      disabled={!newCapsule.title || !newCapsule.content}
                      className="w-full bg-gradient-to-r from-aurora-purple to-nebula-rose text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:from-aurora-purple/80 hover:to-nebula-rose/80 disabled:opacity-50 transition-all duration-300"
                    >
                      Create Memory Capsule
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Capsule