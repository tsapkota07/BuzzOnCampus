import { useState } from 'react'
import MapView from '../components/map/MapView'
import DetailPanel from '../components/map/DetailPanel'
import PostPinModal from '../components/pins/PostPinModal'
import { useAuthStore } from '../store/useAuthStore'
import { getTheme } from '../utils/themes'

export default function MapPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const user = useAuthStore(state => state.user)
  const theme = getTheme(user?.university_id ?? 'other')

  return (
    <>
      <MapView />
      <DetailPanel />

      {/* Bottom — Drop a Buzz button */}
      <div style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
      }}>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 32px',
            borderRadius: 999,
            border: 'none',
            background: theme.buttonGradient,
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${theme.primary}66`,
          }}
        >
          <span style={{ fontSize: 22 }}>📍</span>
          <span style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '0.03em',
          }}>
            Drop a Buzz
          </span>
        </button>
      </div>

      <PostPinModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
