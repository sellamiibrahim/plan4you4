import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import PlanPage from './pages/PlanPage'
import PlaceDetailsPage from './pages/PlaceDetailsPage'
import ResultsPage from './pages/ResultsPage'
import OnboardingPage from './pages/OnboardingPage'
import CreatePostPage from './pages/CreatePostPage'

// fi Routes — ba3d /register:


function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color: 'var(--text)', padding: '2rem' }}>Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/plan" element={<PrivateRoute><PlanPage /></PrivateRoute>} />
          <Route path="/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
          <Route path="/place/:id" element={<PrivateRoute><PlaceDetailsPage /></PrivateRoute>} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/create-post" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
