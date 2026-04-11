import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [orbitLevel, setOrbitLevel] = useState(50)

  // Initialize with some sample stars
  useEffect(() => {
    const sampleStars: Star[] = [
      { id: '1', name: 'Music', x: 150, y: 100, brightness: 0.8, category: 'entertainment' },
      { id: '2', name: 'Coding', x: 300, y: 150, brightness: 0.9, category: 'work' },
      { id: '3', name: 'Coffee', x: 200, y: 250, brightness: 0.7, category: 'lifestyle' },
      { id: '4', name: 'Travel', x: 400, y: 180, brightness: 0.85, category: 'adventure' },
      { id: '5', name: 'Reading', x: 120, y: 300, brightness: 0.6, category: 'learning' },
    ]

    const sampleConstellations: Constellation[] = [
      {
        id: 'shared-1',
        name: 'Creative Souls',
        stars: [sampleStars[0], sampleStars[1]], // Music + Coding
        connections: [[0, 1]]
      },
      {
        id: 'shared-2',
        name: 'Life Explorers',
        stars: [sampleStars[2], sampleStars[3], sampleStars[4]], // Coffee + Travel + Reading
        connections: [[0, 1], [1, 2]]
      }
    ]

    setStars(sampleStars)
    setConstellations(sampleConstellations)
  }, [])

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