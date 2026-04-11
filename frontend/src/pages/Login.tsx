import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, username)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-eclipse-black/80 backdrop-blur-sm rounded-2xl border border-aurora-purple/30 p-8 cosmic-glow">
          <div className="text-center mb-8">
            <h1 className="font-orbitron text-3xl text-starlight-cyan mb-2">
              🛰️ Eclipso
            </h1>
            <p className="text-aurora-purple/80 font-inter">
              {isLogin ? 'Welcome back to your cosmos' : 'Create your cosmic connection'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-starlight-cyan text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple"
                  placeholder="Choose your cosmic name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-starlight-cyan text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-starlight-cyan text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple focus:ring-1 focus:ring-aurora-purple"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-aurora-purple to-nebula-rose text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:from-aurora-purple/80 hover:to-nebula-rose/80 focus:outline-none focus:ring-2 focus:ring-aurora-purple focus:ring-offset-2 focus:ring-offset-deep-space disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? (
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
              ) : (
                isLogin ? 'Enter Cosmos' : 'Create Universe'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-aurora-purple hover:text-aurora-purple/80 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login