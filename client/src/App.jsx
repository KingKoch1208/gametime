import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Ticker from './components/Ticker'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import GameDetail from './pages/GameDetail'
import Trending from './pages/Trending'
import Discover from './pages/Discover'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'

function ProtectedRoute({ children, fallback = '/auth' }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={fallback} replace />
  return children
}

function AuthRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Ticker />
      <main style={{ paddingTop: 'var(--offset)' }}>
        <Routes>
          <Route path="/"          element={<Landing />} />
          <Route path="/auth"      element={<AuthRoute><Auth /></AuthRoute>} />
          <Route path="/home"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/games"     element={<Games />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/trending"  element={<Trending />} />
          <Route path="/discover"  element={<Discover />} />
          <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
