import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './api/firebase'
import { useAuthStore } from './store/useAuthStore'
import { getTheme } from './utils/themes'
import MapPage from './pages/MapPage'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { user, setUser } = useAuthStore()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() } as any)
        }
      } else {
        setUser(null)
      }
      setAuthReady(true)
    })
    return unsub
  }, [])

  if (!authReady) {
    const theme = getTheme('other')
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${theme.primary}33`,
          borderTop: `3px solid ${theme.primary}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ color: theme.subtext, fontSize: 13, fontWeight: 600 }}>Loading...</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/map" replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/map" replace /> : <AuthPage />} />
        <Route path="/map" element={user ? <MapPage /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
