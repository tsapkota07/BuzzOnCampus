import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import MapPage from './pages/MapPage'   // Shafi
import LandingPage from './pages/LandingPage'   // Shafi
// import AuthPage from './pages/AuthPage'           // Sumaiya
// import ProfilePage from './pages/ProfilePage'     // Sumaiya

function App() {
  const user = useAuthStore(state => state.user)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        {/* Uncomment as pages are built:
        <Route path="/map" element={user ? <MapPage /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/map" />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
