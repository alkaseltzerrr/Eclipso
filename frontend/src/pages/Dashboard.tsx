import React from 'react'
import Cosmos from '../components/Cosmos'
import Chat from '../components/Chat'
import OrbitMeter from '../components/OrbitMeter'
import Capsule from '../components/Capsule'
import { useAuth } from '../context/AuthContext'
import { LogOut, Settings } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-3xl text-starlight-cyan mb-2">
              Welcome to your Cosmos, {user?.username}
            </h1>
            <p className="text-aurora-purple/80 font-inter">
              Your shared universe awaits exploration
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              className="p-2 text-aurora-purple hover:text-starlight-cyan transition-colors"
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-nebula-rose hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Cosmos View - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Cosmos />
          </div>

          {/* Orbit Meter */}
          <div className="flex flex-col space-y-6">
            <OrbitMeter />
            <Capsule />
          </div>
        </div>

        {/* Chat Section */}
        <div className="h-96">
          <Chat />
        </div>
      </div>
    </div>
  )
}

export default Dashboard