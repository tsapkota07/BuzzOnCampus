import { useRef, useEffect } from 'react'
import MapView from '../components/map/MapView'
import DetailPanel from '../components/map/DetailPanel'
import { useAuthStore } from '../store/useAuthStore'
import { useMapStore } from '../store/useMapStore'
import { getTheme } from '../utils/themes'

export default function MapPage() {
  const getCenterRef = useRef<(() => { lat: number; lng: number }) | null>(null)

  const user = useAuthStore(state => state.user)
  const theme = getTheme(user?.university_id ?? 'other')
  const { pinPlacementMode, setPinPlacementMode } = useMapStore()

  // ESC cancels placement mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinPlacementMode(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <MapView
        onMapReady={getCenter => { getCenterRef.current = getCenter }}
      />
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
          onClick={() => setPinPlacementMode(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 32px',
            borderRadius: 999,
            border: pinPlacementMode ? '2px solid #fd8b00' : 'none',
            background: pinPlacementMode ? 'rgba(253,139,0,0.15)' : theme.buttonGradient,
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${theme.primary}66`,
            transition: 'all 0.2s',
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
            {pinPlacementMode ? 'Placing...' : 'Drop a Buzz'}
          </span>
        </button>
      </div>
    </>
  )
}
