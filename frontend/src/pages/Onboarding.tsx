import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Music, Code, Coffee, Camera, Book, Plane } from 'lucide-react'

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1)
  const [interests, setInterests] = useState<string[]>([])
  const [avatar, setAvatar] = useState('#8A5DFF')
  const { updateProfile } = useAuth()

  const interestOptions = [
    { name: 'Music', icon: Music, category: 'entertainment' },
    { name: 'Coding', icon: Code, category: 'work' },
    { name: 'Coffee', icon: Coffee, category: 'lifestyle' },
    { name: 'Photography', icon: Camera, category: 'creative' },
    { name: 'Reading', icon: Book, category: 'learning' },
    { name: 'Travel', icon: Plane, category: 'adventure' },
  ]

  const avatarColors = [
    '#8A5DFF', // aurora-purple
    '#FF4F91', // nebula-rose
    '#00FFE0', // starlight-cyan
    '#F9A826', // solar-gold
  ]

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleComplete = async () => {
    try {
      await updateProfile({
        interests,
        avatar,
        isOnboarded: true
      })
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-eclipse-black/80 backdrop-blur-sm rounded-2xl border border-aurora-purple/30 p-8 cosmic-glow">
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl text-starlight-cyan mb-2">
              Welcome to the Cosmos
            </h1>
            <p className="text-aurora-purple/80 font-inter">
              Let's customize your cosmic experience
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-orbitron text-xl text-center text-starlight-cyan mb-6">
                Choose Your Cosmic Avatar
              </h2>
              <div className="flex justify-center space-x-4">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatar(color)}
                    className={`w-16 h-16 rounded-full border-4 transition-all duration-300 ${
                      avatar === color
                        ? 'border-starlight-cyan scale-110 cosmic-glow'
                        : 'border-aurora-purple/30 hover:border-aurora-purple/60'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-aurora-purple to-nebula-rose text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:from-aurora-purple/80 hover:to-nebula-rose/80 transition-all duration-300"
              >
                Continue to Interests
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-orbitron text-xl text-center text-starlight-cyan mb-6">
                Select Your Cosmic Interests
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {interestOptions.map((interest) => {
                  const Icon = interest.icon
                  const isSelected = interests.includes(interest.name)
                  return (
                    <button
                      key={interest.name}
                      onClick={() => toggleInterest(interest.name)}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-aurora-purple bg-aurora-purple/20 text-starlight-cyan'
                          : 'border-aurora-purple/30 hover:border-aurora-purple/60 text-aurora-purple'
                      }`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">{interest.name}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-aurora-purple text-aurora-purple rounded-lg hover:bg-aurora-purple/10 transition-all duration-300"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={interests.length === 0}
                  className="flex-1 bg-gradient-to-r from-aurora-purple to-nebula-rose text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:from-aurora-purple/80 hover:to-nebula-rose/80 disabled:opacity-50 transition-all duration-300"
                >
                  Enter Cosmos
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Onboarding