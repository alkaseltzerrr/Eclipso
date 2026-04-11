import React from 'react'
import { useCosmos } from '../context/CosmosContext'

const Cosmos: React.FC = () => {
  const { stars, constellations, orbitLevel } = useCosmos()

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-deep-space to-eclipse-black rounded-xl overflow-hidden border border-aurora-purple/20">
      {/* Starfield Background */}
      <div className="absolute inset-0 opacity-60">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Constellation lines */}
          {constellations.map((constellation) =>
            constellation.connections.map((connection, idx) => {
              const star1 = constellation.stars[connection[0]]
              const star2 = constellation.stars[connection[1]]
              return (
                <line
                  key={`${constellation.id}-${idx}`}
                  x1={star1.x}
                  y1={star1.y}
                  x2={star2.x}
                  y2={star2.y}
                  className="constellation-line"
                />
              )
            })
          )}
          
          {/* Stars */}
          {stars.map((star) => (
            <g key={star.id}>
              {/* Star glow */}
              <circle
                cx={star.x}
                cy={star.y}
                r={8}
                fill="url(#starGlow)"
                opacity={star.brightness * 0.3}
              />
              {/* Star core */}
              <circle
                cx={star.x}
                cy={star.y}
                r={3}
                fill={getStarColor(star.category)}
                opacity={star.brightness}
                className="animate-pulse-glow"
              />
              {/* Star name tooltip area */}
              <circle
                cx={star.x}
                cy={star.y}
                r={12}
                fill="transparent"
                className="hover:fill-aurora-purple/20 transition-all duration-300 cursor-pointer"
              >
                <title>{star.name}</title>
              </circle>
            </g>
          ))}
          
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="starGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#8A5DFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8A5DFF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Constellation Info Panel */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-eclipse-black/80 backdrop-blur-sm rounded-lg p-4 border border-aurora-purple/30">
          <h3 className="font-orbitron text-lg text-starlight-cyan mb-2">
            Shared Constellations
          </h3>
          <div className="flex flex-wrap gap-2">
            {constellations.map((constellation) => (
              <div
                key={constellation.id}
                className="px-3 py-1 bg-aurora-purple/20 rounded-full text-sm text-starlight-cyan border border-aurora-purple/40"
              >
                {constellation.name} ({constellation.stars.length} stars)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orbit Level Indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-eclipse-black/80 backdrop-blur-sm rounded-lg p-3 border border-aurora-purple/30">
          <div className="flex items-center space-x-3">
            <div className="text-starlight-cyan text-sm font-medium">
              Orbit Level
            </div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-6 rounded-full ${
                    i < orbitLevel / 20
                      ? 'bg-gradient-to-t from-aurora-purple to-starlight-cyan'
                      : 'bg-eclipse-black border border-aurora-purple/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStarColor(category: string): string {
  const colors = {
    entertainment: '#FF4F91', // nebula-rose
    work: '#8A5DFF', // aurora-purple
    lifestyle: '#F9A826', // solar-gold
    adventure: '#00FFE0', // starlight-cyan
    learning: '#8A5DFF', // aurora-purple
    default: '#FFFFFF'
  }
  return colors[category as keyof typeof colors] || colors.default
}

export default Cosmos