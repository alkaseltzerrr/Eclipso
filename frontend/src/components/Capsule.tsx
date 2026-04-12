import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Heart, Image, Mic, FileText, X } from 'lucide-react'
import { withCsrfHeader } from '../utils/csrf'
import { getApiErrorMessage } from '../utils/api'
import { useAuth } from '../context/AuthContext'

interface CapsuleData {
  id: string
  title: string
  content: string
  type: 'text' | 'image' | 'audio'
  createdAt: string
  isLocked: boolean
  unlockVotesCount?: number
  unlockVotesRequired?: number
  viewerHasVoted?: boolean
}

interface NewCapsuleState {
  title: string
  content: string
  type: 'text' | 'image' | 'audio'
  isLocked: boolean
}

interface CapsuleGraphNode {
  id: string
  x: number
  y: number
  size: number
  capsule: CapsuleData
}

interface CapsuleGraphLink {
  from: string
  to: string
  intensity: number
}

const LINK_STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'will', 'your', 'about', 'what', 'when', 'where', 'were', 'their', 'there', 'into', 'only', 'then', 'them', 'more', 'just', 'over', 'also', 'http', 'https'
])

const tokenizeForLinking = (value: string) => {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !LINK_STOP_WORDS.has(token))
}

const buildCapsuleLinks = (items: CapsuleData[]): CapsuleGraphLink[] => {
  const links: CapsuleGraphLink[] = []

  const tokenMap = new Map<string, Set<string>>()
  for (const capsule of items) {
    tokenMap.set(capsule.id, new Set(tokenizeForLinking(`${capsule.title} ${capsule.content}`)))
  }

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const first = items[i]
      const second = items[j]
      const firstTokens = tokenMap.get(first.id) || new Set<string>()
      const secondTokens = tokenMap.get(second.id) || new Set<string>()
      let shared = 0

      firstTokens.forEach((token) => {
        if (secondTokens.has(token)) {
          shared += 1
        }
      })

      const sameTypeBoost = first.type === second.type ? 1 : 0
      const intensity = shared + sameTypeBoost

      if (intensity >= 2) {
        links.push({
          from: first.id,
          to: second.id,
          intensity
        })
      }
    }
  }

  return links.slice(0, 36)
}

const Capsule: React.FC = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view')
  const [capsules, setCapsules] = useState<CapsuleData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'constellation' | 'list'>('constellation')
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null)
  const [newCapsule, setNewCapsule] = useState<NewCapsuleState>({
    title: '',
    content: '',
    type: 'text',
    isLocked: false
  })

  const graphNodes = useMemo<CapsuleGraphNode[]>(() => {
    const graphCapsules = capsules.slice(0, 14)

    return graphCapsules.map((capsule, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(graphCapsules.length, 1)
      const radius = 190 + (index % 3) * 36

      return {
        id: capsule.id,
        capsule,
        x: 440 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        size: capsule.isLocked ? 14 : 11
      }
    })
  }, [capsules])

  const graphLinks = useMemo(() => {
    const graphCapsules = graphNodes.map((node) => node.capsule)
    return buildCapsuleLinks(graphCapsules)
  }, [graphNodes])

  const selectedCapsule = useMemo(() => {
    if (!selectedCapsuleId) {
      return null
    }

    return capsules.find((capsule) => capsule.id === selectedCapsuleId) || null
  }, [capsules, selectedCapsuleId])

  const normalizeCapsule = (capsule: any): CapsuleData => {
    return {
      id: capsule.id,
      title: capsule.title,
      content: capsule.content,
      type: capsule.type,
      createdAt: capsule.createdAt,
      isLocked: capsule.isLocked,
      unlockVotesCount: capsule.unlockVotesCount,
      unlockVotesRequired: capsule.unlockVotesRequired,
      viewerHasVoted: capsule.viewerHasVoted
    }
  }

  const loadCapsules = async () => {
    setIsLoading(true)
    setActionError(null)

    try {
      const response = await fetch('/api/chat/capsules', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to load capsules'))
      }

      const data = await response.json()
      setCapsules((data || []).map(normalizeCapsule))
    } catch (error) {
      console.error('Load capsules error:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to load capsules')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCapsules()
    }
  }, [isOpen])

  useEffect(() => {
    if (capsules.length === 0) {
      setSelectedCapsuleId(null)
      return
    }

    if (!selectedCapsuleId || !capsules.some((capsule) => capsule.id === selectedCapsuleId)) {
      setSelectedCapsuleId(capsules[0].id)
    }
  }, [capsules, selectedCapsuleId])

  const handleCreateCapsule = async () => {
    if (!newCapsule.title || !newCapsule.content) {
      return
    }

    setIsCreating(true)
    setActionError(null)

    try {
      const csrfHeaders = await withCsrfHeader({
        'Content-Type': 'application/json'
      })

      const response = await fetch('/api/chat/capsules', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders,
        body: JSON.stringify({
          title: newCapsule.title,
          content: newCapsule.content,
          type: newCapsule.type,
          isLocked: newCapsule.isLocked
        })
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to create capsule'))
      }

      const createdCapsule = normalizeCapsule(await response.json())
      setCapsules((prev) => [createdCapsule, ...prev])
      setSelectedCapsuleId(createdCapsule.id)
      setNewCapsule({ title: '', content: '', type: 'text', isLocked: false })
      setActiveTab('view')
    } catch (error) {
      console.error('Create capsule error:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to create capsule')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUnlockCapsule = async (capsuleId: string) => {
    setActionError(null)

    try {
      const csrfHeaders = await withCsrfHeader()

      const response = await fetch(`/api/chat/capsules/${capsuleId}/unlock`, {
        method: 'PUT',
        credentials: 'include',
        headers: csrfHeaders
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to unlock capsule'))
      }

      const payload = await response.json()
      const updatedCapsule = normalizeCapsule(payload.capsule)

      setCapsules((prev) => prev.map((capsule) => {
        if (capsule.id !== capsuleId) {
          return capsule
        }

        return updatedCapsule
      }))

      if (payload.status === 'awaiting_partner') {
        setActionError('Unlock requested. Waiting for partner confirmation.')
      } else if (payload.status === 'unlocked') {
        setActionError(null)
      }
    } catch (error) {
      console.error('Unlock capsule error:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to unlock capsule')
    }
  }

  const renderCapsuleContent = (capsule: CapsuleData) => {
    if (capsule.type === 'image') {
      return (
        <div className="space-y-2">
          <img
            src={capsule.content}
            alt={capsule.title}
            className="w-full max-h-56 object-cover rounded-lg border border-aurora-purple/20"
            loading="lazy"
          />
          <a
            href={capsule.content}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-starlight-cyan hover:underline"
          >
            Open image source
          </a>
        </div>
      )
    }

    if (capsule.type === 'audio') {
      return (
        <div className="space-y-2">
          <audio controls src={capsule.content} preload="none" className="w-full" />
          <a
            href={capsule.content}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-starlight-cyan hover:underline"
          >
            Open audio source
          </a>
        </div>
      )
    }

    return <p className="text-starlight-cyan/80">{capsule.content}</p>
  }

  const getContentLabel = () => {
    if (newCapsule.type === 'image') {
      return 'Image URL'
    }

    if (newCapsule.type === 'audio') {
      return 'Audio URL'
    }

    return 'Memory Content'
  }

  const getContentPlaceholder = () => {
    if (newCapsule.type === 'image') {
      return 'https://example.com/memory.jpg'
    }

    if (newCapsule.type === 'audio') {
      return 'https://example.com/memory.mp3'
    }

    return 'Capture this moment in words...'
  }

  const renderCapsulePanel = (capsule: CapsuleData) => {
    return (
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
            {capsule.isLocked && capsule.unlockVotesRequired && (
              <p className="text-xs text-solar-gold/80 mt-1">
                Unlock votes: {capsule.unlockVotesCount || 0}/{capsule.unlockVotesRequired}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {capsule.isLocked && (
              <div className="flex items-center space-x-1 text-solar-gold">
                <Heart className="w-4 h-4" />
                <span className="text-xs">Locked</span>
              </div>
            )}
            {capsule.isLocked && !capsule.viewerHasVoted && (
              <button
                onClick={() => handleUnlockCapsule(capsule.id)}
                className="px-3 py-1 rounded-full border border-solar-gold/60 text-solar-gold text-xs hover:bg-solar-gold/10 transition-colors"
              >
                Unlock
              </button>
            )}
            {capsule.isLocked && capsule.viewerHasVoted && (
              <span className="px-3 py-1 rounded-full border border-solar-gold/30 text-solar-gold/80 text-xs">
                Waiting Partner
              </span>
            )}
          </div>
        </div>
        {renderCapsuleContent(capsule)}
      </div>
    )
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
          {actionError && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
              {actionError}
            </div>
          )}

          {isLoading && (
            <div className="text-sm text-aurora-purple/80">Loading capsules...</div>
          )}

          {!isLoading && capsules.length === 0 && (
            <div className="text-sm text-aurora-purple/80">No capsules yet.</div>
          )}

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
                    {actionError && (
                      <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
                        {actionError}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-aurora-purple/75">
                        Links are inferred from shared words and capsule type. Not persisted in backend yet.
                      </div>
                      <div className="inline-flex rounded-full border border-aurora-purple/30 p-1 bg-deep-space/50">
                        <button
                          onClick={() => setViewMode('constellation')}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            viewMode === 'constellation'
                              ? 'bg-aurora-purple/50 text-white'
                              : 'text-aurora-purple hover:text-starlight-cyan'
                          }`}
                        >
                          Constellation
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            viewMode === 'list'
                              ? 'bg-aurora-purple/50 text-white'
                              : 'text-aurora-purple hover:text-starlight-cyan'
                          }`}
                        >
                          List
                        </button>
                      </div>
                    </div>

                    {isLoading && (
                      <div className="text-sm text-aurora-purple/80">Loading capsules...</div>
                    )}

                    {!isLoading && capsules.length === 0 && (
                      <div className="text-sm text-aurora-purple/80">No capsules yet. Create first memory capsule.</div>
                    )}

                    {!isLoading && capsules.length > 0 && viewMode === 'list' && capsules.map((capsule) => renderCapsulePanel(capsule))}

                    {!isLoading && capsules.length > 0 && viewMode === 'constellation' && (
                      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-4">
                        <div className="rounded-xl border border-aurora-purple/25 bg-deep-space/40 p-2 md:p-3 overflow-hidden">
                          <svg viewBox="0 0 880 500" className="w-full h-[360px] md:h-[430px]">
                            <defs>
                              <linearGradient id="capsule-link-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(136,93,255,0.25)" />
                                <stop offset="100%" stopColor="rgba(255,79,145,0.32)" />
                              </linearGradient>
                            </defs>

                            {graphLinks.map((link) => {
                              const fromNode = graphNodes.find((node) => node.id === link.from)
                              const toNode = graphNodes.find((node) => node.id === link.to)

                              if (!fromNode || !toNode) {
                                return null
                              }

                              return (
                                <line
                                  key={`${link.from}-${link.to}`}
                                  x1={fromNode.x}
                                  y1={fromNode.y}
                                  x2={toNode.x}
                                  y2={toNode.y}
                                  stroke="url(#capsule-link-glow)"
                                  strokeWidth={Math.min(3.5, 1 + link.intensity * 0.45)}
                                  strokeLinecap="round"
                                />
                              )
                            })}

                            {graphNodes.map((node) => {
                              const isSelected = selectedCapsuleId === node.id

                              return (
                                <g key={node.id} onClick={() => setSelectedCapsuleId(node.id)} className="cursor-pointer">
                                  <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={node.size + (isSelected ? 10 : 6)}
                                    fill={isSelected ? 'rgba(255, 196, 255, 0.24)' : 'rgba(138, 93, 255, 0.2)'}
                                  />
                                  <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={node.size}
                                    fill={node.capsule.isLocked ? '#F9A826' : '#8A5DFF'}
                                    opacity={isSelected ? 1 : 0.88}
                                  />
                                  <text
                                    x={node.x}
                                    y={node.y + node.size + 18}
                                    textAnchor="middle"
                                    fill="rgba(230, 214, 255, 0.95)"
                                    fontSize="12"
                                    fontFamily="Sora"
                                  >
                                    {node.capsule.title.slice(0, 16)}
                                  </text>
                                </g>
                              )
                            })}
                          </svg>
                        </div>

                        <div className="space-y-3">
                          {selectedCapsule ? (
                            renderCapsulePanel(selectedCapsule)
                          ) : (
                            <div className="rounded-lg border border-aurora-purple/30 bg-aurora-purple/10 p-4 text-sm text-aurora-purple/80">
                              Pick star node to inspect capsule details.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                        {getContentLabel()}
                      </label>
                      {newCapsule.type === 'text' ? (
                        <textarea
                          value={newCapsule.content}
                          onChange={(e) => setNewCapsule({...newCapsule, content: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple resize-none"
                          placeholder={getContentPlaceholder()}
                        />
                      ) : (
                        <input
                          type="url"
                          value={newCapsule.content}
                          onChange={(e) => setNewCapsule({...newCapsule, content: e.target.value})}
                          className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple"
                          placeholder={getContentPlaceholder()}
                        />
                      )}
                    </div>

                    <div className="rounded-lg border border-solar-gold/30 bg-solar-gold/5 p-3">
                      <label className="flex items-center justify-between gap-3">
                        <span className="text-sm text-solar-gold">Lock capsule (needs both partners to unlock)</span>
                        <input
                          type="checkbox"
                          checked={newCapsule.isLocked}
                          onChange={(e) => setNewCapsule({ ...newCapsule, isLocked: e.target.checked })}
                          disabled={!user?.partnerId}
                          className="h-4 w-4 accent-solar-gold"
                        />
                      </label>
                      {!user?.partnerId && (
                        <p className="text-xs text-solar-gold/70 mt-2">Connect partner first to create locked capsule.</p>
                      )}
                    </div>

                    <button
                      onClick={handleCreateCapsule}
                      disabled={!newCapsule.title || !newCapsule.content || isCreating}
                      className="w-full bg-gradient-to-r from-aurora-purple to-nebula-rose text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:from-aurora-purple/80 hover:to-nebula-rose/80 disabled:opacity-50 transition-all duration-300"
                    >
                      {isCreating ? 'Creating...' : 'Create Memory Capsule'}
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