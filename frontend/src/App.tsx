import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import MapPage from './pages/MapPage'   // Shafi
import LandingPage from './pages/LandingPage'   // Shafi
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
// import ProfilePage from './pages/ProfilePage'     // Sumaiya

function App() {
  const user = useAuthStore(state => state.user)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/map" element={user ? <MapPage /> : <Navigate to="/" replace />} />
        {/* <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} /> */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
