import React from 'react'
import { useCosmos } from '../context/CosmosContext'
import { motion } from 'framer-motion'

const OrbitMeter: React.FC = () => {
  const { orbitLevel } = useCosmos()
  
  const getOrbitText = (level: number) => {
    if (level >= 80) return "Stellar Connection"
    if (level >= 60) return "Active Orbit"
    if (level >= 40) return "Steady Drift"
    if (level >= 20) return "Distant Stars"
    return "Cosmic Silence"
  }

  const getOrbitColor = (level: number) => {
    if (level >= 80) return "from-starlight-cyan to-solar-gold"
    if (level >= 60) return "from-aurora-purple to-starlight-cyan"
    if (level >= 40) return "from-aurora-purple to-nebula-rose"
    if (level >= 20) return "from-nebula-rose to-aurora-purple"
    return "from-deep-space to-aurora-purple"
  }

  return (
    <div className="bg-eclipse-black/60 backdrop-blur-sm rounded-xl border border-aurora-purple/20 p-6">
      <div className="text-center mb-6">
        <h3 className="font-orbitron text-xl text-starlight-cyan mb-2">
          Connection Orbit
        </h3>
        <p className="text-aurora-purple/80 text-sm">
          {getOrbitText(orbitLevel)}
        </p>
      </div>

      {/* Circular Orbit Meter */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        {/* Background Circle */}
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(138, 93, 255, 0.2)"
            strokeWidth="8"
            fill="transparent"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#orbitGradient)"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={283} // Circumference
            strokeDashoffset={283 - (283 * orbitLevel) / 100}
            initial={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: 283 - (283 * orbitLevel) / 100 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A5DFF" />
              <stop offset="50%" stopColor="#FF4F91" />
              <stop offset="100%" stopColor="#00FFE0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-orbitron text-starlight-cyan">
              {orbitLevel}%
            </div>
          </div>
        </div>

        {/* Orbiting Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="w-3 h-3 bg-aurora-purple rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              transformOrigin: "50% 64px",
            }}
          />
          <motion.div
            className="w-2 h-2 bg-starlight-cyan rounded-full absolute top-2 left-1/2 transform -translate-x-1/2"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              transformOrigin: "50% 56px",
            }}
          />
        </div>
      </div>

      {/* Level Indicators */}
      <div className="flex justify-between text-xs text-aurora-purple/60 mb-4">
        <span>Silent</span>
        <span>Active</span>
        <span>Stellar</span>
      </div>

      {/* Connection Status */}
      <div className="text-center">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getOrbitColor(orbitLevel)} text-white`}>
          Level {Math.floor(orbitLevel / 20) + 1}
        </div>
      </div>
    </div>
  )
}

export default OrbitMeter