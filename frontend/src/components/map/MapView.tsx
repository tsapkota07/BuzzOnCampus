import { useRef, useState } from 'react'
import Map, { Marker, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import AvatarMarker from './AvatarMarker'
import PlaceMarker from './PlaceMarker'
import Navbar from '../ui/Navbar'
import PostPinModal from '../pins/PostPinModal'
import { useMapStore } from '../../store/useMapStore'
import { mockUserPins, mockPlaces } from '../../data/mockPins'

interface MapViewProps {
  onMapClick?: (lat: number, lng: number) => void
}

const NAV_ITEMS = [
  { icon: '📍', label: 'Drop a Buzz', key: 'post' },
  { icon: '📅', label: 'Events',      key: 'events' },
  { icon: '⚡', label: 'Volunteer',   key: 'volunteer' },
  { icon: '👤', label: 'Profile',     key: 'profile' },
]

export default function MapView({ onMapClick }: MapViewProps) {
  const [is3D, setIs3D]           = useState(false)
  const [activeNav, setActiveNav] = useState('post')
  const [modalOpen, setModalOpen] = useState(false)
  const mapRef = useRef<MapRef>(null)
  const { activeFilters, setSelectedPin, setSelectedPlace } = useMapStore()

  // TODO: Replace mockUserPins with onSnapshot from Firestore
  // query: collection(db, 'pins') where university_id == user.university_id and status == 'active'
  const visibleUserPins = mockUserPins.filter(p => activeFilters.includes(p.type))
  const visiblePlaces   = mockPlaces.filter(() => activeFilters.includes('places'))

  const zoomIn  = () => mapRef.current?.zoomIn({ duration: 300 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 300 })

  const locateMe = () => {
    // TODO: Call navigator.geolocation.getCurrentPosition and use map.flyTo to animate to user location
    navigator.geolocation.getCurrentPosition(pos => {
      mapRef.current?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 15,
        duration: 1200,
      })
    })
  }

  const mapControlBtn = {
    width: 40,
    height: 40,
    background: 'rgba(0,0,0,0.75)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    cursor: 'pointer',
    color: 'white',
    fontSize: 18,
    backdropFilter: 'blur(8px)',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      {/* Navbar + filter chips */}
      <Navbar />

      {/* ── Right-side map controls ── */}
      <div style={{
        position: 'absolute',
        bottom: 110,
        right: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Zoom in */}
        <button style={mapControlBtn} onClick={zoomIn} title="Zoom in">+</button>

        {/* Zoom out */}
        <button style={mapControlBtn} onClick={zoomOut} title="Zoom out">−</button>

        {/* Locate me */}
        <button style={mapControlBtn} onClick={locateMe} title="Locate me">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>my_location</span>
        </button>

        {/* 2D / 3D toggle */}
        <button
          style={{
            ...mapControlBtn,
            fontWeight: 'bold',
            fontSize: 13,
            color: is3D ? '#fd8b00' : 'white',
            border: is3D
              ? '1px solid #fd8b00'
              : '1px solid rgba(255,255,255,0.15)',
          }}
          onClick={() => {
            const newPitch = is3D ? 0 : 60
            mapRef.current?.easeTo({ pitch: newPitch, duration: 1000 })
            setIs3D(!is3D)
          }}
        >
          {is3D ? '2D' : '3D'}
        </button>
      </div>

      {/* ── Bottom action bar ── */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '10px 20px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeNav === item.key
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveNav(item.key)
                if (item.key === 'post') setModalOpen(true)
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 22px',
                borderRadius: 999,
                border: 'none',
                background: isActive ? 'rgba(253,139,0,0.15)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 26 }}>{item.icon}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: isActive ? '#fd8b00' : 'rgba(255,255,255,0.7)',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '0.03em',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          latitude: 41.1006,
          longitude: -80.6481,
          zoom: 14,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={e => onMapClick?.(e.lngLat.lat, e.lngLat.lng)}
      >
        {/* User pin markers */}
        {visibleUserPins.map(pin => (
          <Marker key={pin.id} latitude={pin.lat} longitude={pin.lng} anchor="bottom">
            <AvatarMarker
              userColor={pin.userColor}
              type={pin.type}
              onClick={() => setSelectedPin(pin)}
            />
          </Marker>
        ))}

        {/* Place markers */}
        {visiblePlaces.map(place => (
          <Marker key={place.id} latitude={place.lat} longitude={place.lng} anchor="bottom">
            <PlaceMarker
              category={place.category}
              name={place.name}
              onClick={() => setSelectedPlace(place)}
            />
          </Marker>
        ))}

        <Layer
          id="3d-buildings"
          source="composite"
          source-layer="building"
          filter={['==', 'extrude', 'true']}
          type="fill-extrusion"
          minzoom={15}
          paint={{
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-opacity': 0.6,
          }}
        />
      </Map>

      <PostPinModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
