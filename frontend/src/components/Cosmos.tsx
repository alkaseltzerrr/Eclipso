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
          {stars.map((star) => {
            const color = getStarColor(star.category)
            const coreRadius = 1.6 + star.brightness * 2.3
            const haloRadius = coreRadius * 4.6
            const glintLength = coreRadius * 4.8
            const gradientId = `halo-${star.id}`

            return (
              <g key={star.id}>
                <defs>
                  <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.58" />
                    <stop offset="55%" stopColor={color} stopOpacity="0.16" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </radialGradient>
                </defs>

                <circle
                  cx={star.x}
                  cy={star.y}
                  r={haloRadius}
                  fill={`url(#${gradientId})`}
                  opacity={0.95}
                />

                <circle
                  cx={star.x}
                  cy={star.y}
                  r={coreRadius * 1.75}
                  fill={color}
                  opacity={0.22 + star.brightness * 0.22}
                />

                {star.brightness > 0.62 && (
                  <g opacity={0.55}>
                    <line
                      x1={star.x - glintLength}
                      y1={star.y}
                      x2={star.x + glintLength}
                      y2={star.y}
                      stroke={color}
                      strokeWidth="0.7"
                    />
                    <line
                      x1={star.x}
                      y1={star.y - glintLength}
                      x2={star.x}
                      y2={star.y + glintLength}
                      stroke={color}
                      strokeWidth="0.7"
                    />
                  </g>
                )}

                <circle
                  cx={star.x}
                  cy={star.y}
                  r={coreRadius}
                  fill="#fffdfd"
                  opacity={0.9}
                  className="animate-pulse-glow"
                />

                {/* Star name tooltip area */}
                <circle
                  cx={star.x}
                  cy={star.y}
                  r={haloRadius}
                  fill="transparent"
                  className="hover:fill-aurora-purple/20 transition-all duration-300 cursor-pointer"
                >
                  <title>{star.name}</title>
                </circle>
              </g>
            )
          })}
          
          {/* Gradient definitions */}
          <defs>
            <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
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