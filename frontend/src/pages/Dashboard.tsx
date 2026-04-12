import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, LogOut, MessageCircle, Orbit, Sparkles, Users } from 'lucide-react'
import Capsule from '../components/Capsule'
import Chat from '../components/Chat'
import Cosmos from '../components/Cosmos'
import OrbitMeter from '../components/OrbitMeter'
import PartnerManager from '../components/PartnerManager'
import { useAuth } from '../context/AuthContext'

type SectionId = 'atlas' | 'messages' | 'capsules' | 'bonds'

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<SectionId>('atlas')

  const sections = useMemo(() => {
    return [
      {
        id: 'atlas' as const,
        title: 'Sky Atlas',
        subtitle: 'Shared stars and mood orbit',
        icon: Orbit
      },
      {
        id: 'messages' as const,
        title: 'Message Orbit',
        subtitle: 'Realtime heartline',
        icon: MessageCircle
      },
      {
        id: 'capsules' as const,
        title: 'Capsule Constellation',
        subtitle: 'Interlinked memory notes',
        icon: BookOpen
      },
      {
        id: 'bonds' as const,
        title: 'Bond Room',
        subtitle: 'Partnership lifecycle',
        icon: Users
      }
    ]
  }, [])

  const activeSectionData = sections.find((section) => section.id === activeSection)

  const renderSection = () => {
    if (activeSection === 'atlas') {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="sentimental-haze rounded-2xl p-5 md:p-6">
              <p className="text-xs tracking-[0.2em] uppercase text-starlight-cyan/70 mb-3">Shared Sky</p>
              <h2 className="font-orbitron text-2xl md:text-3xl text-white leading-tight">
                Every shared interest becomes star, every memory bends gravity.
              </h2>
              <p className="mt-3 text-aurora-purple/80 max-w-2xl">
                This section focuses only on constellation and orbit mood so story of your bond reads like one clear sky map.
              </p>
            </div>
            <Cosmos />
          </div>
          <div className="space-y-6">
            <OrbitMeter />
            <div className="sentimental-haze rounded-2xl p-5">
              <div className="flex items-center gap-2 text-solar-gold mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.18em]">Sentimental Pulse</span>
              </div>
              <p className="text-sm text-starlight-cyan/90 leading-relaxed">
                Orbit level rises with dialogue and capsules. Low orbit means distance. High orbit means emotional gravity held.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (activeSection === 'messages') {
      return (
        <div className="space-y-5">
          <div className="sentimental-haze rounded-2xl p-5 md:p-6">
            <p className="text-xs tracking-[0.2em] uppercase text-starlight-cyan/70 mb-2">Realtime Channel</p>
            <h2 className="font-orbitron text-2xl text-white">Message Orbit</h2>
            <p className="text-aurora-purple/80 mt-2">Chat isolated here so it feels like dedicated night call window, not widget.</p>
          </div>
          <div className="h-[65vh] min-h-[420px]">
            <Chat />
          </div>
        </div>
      )
    }

    if (activeSection === 'capsules') {
      return (
        <div className="space-y-5">
          <div className="sentimental-haze rounded-2xl p-5 md:p-6">
            <p className="text-xs tracking-[0.2em] uppercase text-starlight-cyan/70 mb-2">Interlinked Notes</p>
            <h2 className="font-orbitron text-2xl text-white">Capsule Constellation</h2>
            <p className="text-aurora-purple/80 mt-2">
              Inspired by linked-note thinking. Current backend stores capsules individually; visual links are inferred in UI from shared themes and types.
            </p>
          </div>
          <Capsule />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <PartnerManager />
        <div className="sentimental-haze rounded-2xl p-6">
          <p className="text-xs tracking-[0.2em] uppercase text-starlight-cyan/70 mb-2">Bond Status</p>
          <h2 className="font-orbitron text-2xl text-white mb-3">Partnership Room</h2>
          <p className="text-aurora-purple/85 leading-relaxed">
            Invite, accept, decline, disconnect all live here. This room handles relationship state while other rooms focus on expression.
          </p>
          <div className="mt-5">
            <OrbitMeter />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="sentimental-haze rounded-3xl p-5 md:p-7 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.22em] uppercase text-starlight-cyan/70 mb-2">Eclipso Workspace</p>
              <h1 className="font-orbitron text-3xl md:text-4xl text-white leading-tight">
                {user?.username}, your universe now has rooms.
              </h1>
              <p className="text-aurora-purple/80 mt-3 max-w-3xl">
                No more single crowded panel. Navigate each emotional layer separately: sky, dialogue, memory capsules, partnership.
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-nebula-rose/50 text-nebula-rose hover:bg-nebula-rose/15 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
          <aside className="sentimental-haze rounded-2xl p-3 md:p-4 h-fit">
            <nav className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-visible">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`min-w-[210px] xl:min-w-0 text-left rounded-xl p-3 transition-all border ${
                      isActive
                        ? 'border-starlight-cyan/50 bg-gradient-to-r from-aurora-purple/45 to-nebula-rose/35 text-white'
                        : 'border-aurora-purple/20 bg-black/20 text-aurora-purple/85 hover:border-aurora-purple/45 hover:text-starlight-cyan'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-orbitron text-sm">{section.title}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{section.subtitle}</p>
                  </button>
                )
              })}
            </nav>
          </aside>

          <div>
            <AnimatePresence mode="wait">
              <motion.section
                key={activeSection}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                aria-label={activeSectionData?.title || 'Dashboard section'}
              >
                {renderSection()}
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
