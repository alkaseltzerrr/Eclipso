import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface Star {
  id: string
  name: string
  x: number
  y: number
  brightness: number
  category: string
}

interface Constellation {
  id: string
  name: string
  stars: Star[]
  connections: Array<[number, number]>
}

interface CosmosContextType {
  stars: Star[]
  constellations: Constellation[]
  orbitLevel: number
  addStar: (star: Omit<Star, 'id'>) => void
  updateOrbitLevel: (level: number) => void
  getSharedConstellations: () => Constellation[]
}

const CosmosContext = createContext<CosmosContextType | null>(null)

export const useCosmos = () => {
  const context = useContext(CosmosContext)
  if (!context) {
    throw new Error('useCosmos must be used within a CosmosProvider')
  }
  return context
}

export const CosmosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stars, setStars] = useState<Star[]>([])
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [orbitLevel, setOrbitLevel] = useState(10)
  const { user } = useAuth()

  useEffect(() => {
    const loadCosmos = async () => {
      const token = localStorage.getItem('token')

      if (!user || !token) {
        setStars([])
        setConstellations([])
        setOrbitLevel(10)
        return
      }

      try {
        const response = await fetch('/api/users/cosmos', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load cosmos data')
        }

        const data = await response.json()

        const normalizedStars: Star[] = Array.isArray(data.stars)
          ? data.stars.map((star: any, index: number) => ({
              id: String(star.id || `star-${index}`),
              name: String(star.name || `Star ${index + 1}`),
              x: Number(star.x || 200),
              y: Number(star.y || 200),
              brightness: Number(star.brightness || 0.75),
              category: String(star.category || 'custom')
            }))
          : []

        const normalizedConstellations: Constellation[] = Array.isArray(data.constellations)
          ? data.constellations.map((constellation: any, index: number) => {
              const constellationStars: Star[] = Array.isArray(constellation.stars)
                ? constellation.stars.map((star: any, starIndex: number) => ({
                    id: String(star.id || `${index}-${starIndex}`),
                    name: String(star.name || `Star ${starIndex + 1}`),
                    x: Number(star.x || 200),
                    y: Number(star.y || 200),
                    brightness: Number(star.brightness || 0.75),
                    category: String(star.category || 'custom')
                  }))
                : []

              const connections: Array<[number, number]> = Array.isArray(constellation.connections)
                ? constellation.connections
                    .map((connection: any) => {
                      if (!Array.isArray(connection) || connection.length !== 2) {
                        return null
                      }

                      return [Number(connection[0]), Number(connection[1])] as [number, number]
                    })
                    .filter(Boolean) as Array<[number, number]>
                : []

              return {
                id: String(constellation.id || `constellation-${index}`),
                name: String(constellation.name || `Constellation ${index + 1}`),
                stars: constellationStars,
                connections
              }
            })
          : []

        setStars(normalizedStars)
        setConstellations(normalizedConstellations)
        setOrbitLevel(Math.max(0, Math.min(100, Number(data.orbitLevel || 10))))
      } catch (error) {
        console.error('Failed to load cosmos data:', error)
        setStars([])
        setConstellations([])
        setOrbitLevel(10)
      }
    }

    loadCosmos()
  }, [user?.id, user?.partnerId])

  const addStar = (starData: Omit<Star, 'id'>) => {
    const newStar: Star = {
      ...starData,
      id: `star-${Date.now()}`,
    }
    setStars(prev => [...prev, newStar])
  }

  const updateOrbitLevel = (level: number) => {
    setOrbitLevel(level)
  }

  const getSharedConstellations = () => {
    // In a real app, this would filter constellations based on shared interests
    return constellations
  }

  return (
    <CosmosContext.Provider value={{
      stars,
      constellations,
      orbitLevel,
      addStar,
      updateOrbitLevel,
      getSharedConstellations,
    }}>
      {children}
    </CosmosContext.Provider>
  )
}