import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './api/firebase'
import { useAuthStore } from './store/useAuthStore'
import MapPage from './pages/MapPage'   // Shafi
import LandingPage from './pages/LandingPage'   // Shafi
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
// import ProfilePage from './pages/ProfilePage'     // Sumaiya

function App() {
  const { user, setUser } = useAuthStore()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists() && snap.data().email_verified === true) {
          setUser({ uid: firebaseUser.uid, ...snap.data() } as any)
        }
      } else {
        setUser(null)
      }
      setAuthReady(true)
    })
    return unsub
  }, [])

  if (!authReady) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/map" replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/map" replace /> : <AuthPage />} />
        <Route path="/map" element={user ? <MapPage /> : <Navigate to="/" replace />} />
        {/* <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} /> */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
