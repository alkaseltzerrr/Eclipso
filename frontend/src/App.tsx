import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CosmosProvider } from './context/CosmosContext'
import { SocketProvider } from './context/SocketContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import { useAuth } from './hooks/useAuth'
import Starfield from './components/Starfield'

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-aurora-purple to-nebula-rose"></div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/onboarding" 
        element={user && !user.isOnboarded ? <Onboarding /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

function App() {
  return (
    <div className="min-h-screen relative">
      <Starfield />
      <Router>
        <AuthProvider>
          <CosmosProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </CosmosProvider>
        </AuthProvider>
      </Router>
    </div>
  )
}

export default App