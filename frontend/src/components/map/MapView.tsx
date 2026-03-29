import { useRef, useState, useEffect, useMemo } from 'react'
import type * as GeoJSON from 'geojson'
import Map, { Marker, Layer, Source } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import AvatarMarker from './AvatarMarker'
import Navbar from '../ui/Navbar'
import { useMapStore } from '../../store/useMapStore'
import type { MockUserPin } from '../../store/useMapStore' // needed for mapped type in useEffect
import { useAuthStore } from '../../store/useAuthStore'
import { subscribeToPins } from '../../api/pins'
import { getUniversityCoords, isRestrictedAccount, isWithinCampus } from '../../utils/universityCoords'

interface MapViewProps {
  onMapClick?: (lat: number, lng: number) => void
  // Called once map loads — passes a function MapPage can call to get current center
  onMapReady?: (getCenter: () => { lat: number; lng: number }) => void
}

/** Builds a GeoJSON polygon covering the whole world MINUS a circle around the campus.
 *  Rendered as a fill layer → everything outside the radius gets the red tint. */
function buildGeofenceGeoJSON(lat: number, lng: number, radiusM: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const POINTS = 64
  const earthR = 6371000
  const angularR = radiusM / earthR
  const circle: [number, number][] = []
  for (let i = 0; i <= POINTS; i++) {
    const angle = (i / POINTS) * 2 * Math.PI
    const dLat = angularR * Math.cos(angle)
    const dLng = angularR * Math.sin(angle) / Math.cos(lat * Math.PI / 180)
    circle.push([lng + dLng * (180 / Math.PI), lat + dLat * (180 / Math.PI)])
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      // Outer ring: entire world. Inner ring (hole): the campus circle.
      // GeoJSON hole = inner ring wound clockwise (opposite of outer).
      coordinates: [
        [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
        circle,
      ],
    },
  }
}

/** Builds a GeoJSON LineString tracing just the campus circle boundary.
 *  Used to show the geofence border in 3D mode. */
function buildCircleLineGeoJSON(lat: number, lng: number, radiusM: number): GeoJSON.Feature<GeoJSON.LineString> {
  const POINTS = 64
  const earthR = 6371000
  const angularR = radiusM / earthR
  const coords: [number, number][] = []
  for (let i = 0; i <= POINTS; i++) {
    const angle = (i / POINTS) * 2 * Math.PI
    const dLat = angularR * Math.cos(angle)
    const dLng = angularR * Math.sin(angle) / Math.cos(lat * Math.PI / 180)
    coords.push([lng + dLng * (180 / Math.PI), lat + dLat * (180 / Math.PI)])
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: coords },
  }
}

// 3D model per pin type — swap these out as more models are assigned
const PIN_MODEL: Record<string, string> = {
  event:     '/Alien.glb',
  volunteer: '/Dinosaur.glb',
  help:      '/Caveman.glb',
  business:  '/Podium.glb',
}

/** Spread pins that are within ~20 m of each other into a small circle so
 *  each one is individually visible and clickable on the map. */
function spreadOverlappingPins(pins: MockUserPin[]): Array<MockUserPin & { renderLat: number; renderLng: number }> {
  const THRESHOLD = 0.00018  // ~20 m in degrees
  const SPREAD_R  = 0.00028  // ~31 m spread radius
  const assigned = new Set<string>()
  const result: Array<MockUserPin & { renderLat: number; renderLng: number }> = []

  for (const pin of pins) {
    if (assigned.has(pin.id)) continue
    const group: MockUserPin[] = [pin]
    assigned.add(pin.id)
    for (const other of pins) {
      if (assigned.has(other.id)) continue
      if (Math.abs(pin.lat - other.lat) < THRESHOLD && Math.abs(pin.lng - other.lng) < THRESHOLD) {
        group.push(other)
        assigned.add(other.id)
      }
    }
    if (group.length === 1) {
      result.push({ ...pin, renderLat: pin.lat, renderLng: pin.lng })
    } else {
      group.forEach((p, i) => {
        const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
        result.push({
          ...p,
          renderLat: p.lat + SPREAD_R * Math.cos(angle),
          renderLng: p.lng + SPREAD_R * Math.sin(angle) / Math.cos(p.lat * Math.PI / 180),
        })
      })
    }
  }
  return result
}

function mapboxCategoryToOurs(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('restaurant') || c.includes('food') || c.includes('dining')) return 'restaurant'
  if (c.includes('cafe') || c.includes('coffee')) return 'cafe'
  if (c.includes('bar') || c.includes('pub') || c.includes('nightlife')) return 'bar'
  if (c.includes('gym') || c.includes('fitness') || c.includes('recreation')) return 'gym'
  if (c.includes('library')) return 'library'
  if (c.includes('university') || c.includes('college') || c.includes('school')) return 'university'
  if (c.includes('shop') || c.includes('store') || c.includes('retail')) return 'retail'
  return 'general'
}

export default function MapView({ onMapClick, onMapReady }: MapViewProps) {
  const [is3D, setIs3D] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationBanner, setShowLocationBanner] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [hoverInBounds, setHoverInBounds] = useState(true)
  const [outOfBoundsToast, setOutOfBoundsToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef<MapRef>(null)
  const centeredRef = useRef(false)
  const pendingCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  // Ref so Mapbox event handlers (registered in onLoad) can read current placement mode
  const placementModeRef = useRef(false)
  const { activeFilters, livePins, setLivePins, setSelectedPin, setSelectedPlace,
          pinPlacementMode, hoveredPlace, setPinPlacementMode, setHoveredPlace, setCreatePinContext } = useMapStore()
  const user = useAuthStore(state => state.user)
  const universityCoords = getUniversityCoords(user?.university_id ?? 'other')
  const restricted = isRestrictedAccount(user?.university_id ?? 'other')

  const geofenceGeoJSON = useMemo(() => {
    if (!restricted) return null
    return buildGeofenceGeoJSON(universityCoords.lat, universityCoords.lng, universityCoords.radiusM)
  }, [universityCoords.lat, universityCoords.lng, universityCoords.radiusM, restricted])

  const circleLineGeoJSON = useMemo(() => {
    if (!restricted) return null
    return buildCircleLineGeoJSON(universityCoords.lat, universityCoords.lng, universityCoords.radiusM)
  }, [universityCoords.lat, universityCoords.lng, universityCoords.radiusM, restricted])

  // Keep ref in sync with store so Mapbox handlers can read it
  useEffect(() => {
    placementModeRef.current = pinPlacementMode
    const canvas = mapRef.current?.getMap()?.getCanvas()
    if (canvas) canvas.style.cursor = pinPlacementMode ? 'none' : ''
  }, [pinPlacementMode])

  const flyToCenter = (loc: { lat: number; lng: number }) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 15, duration: 1200 })
    } else {
      pendingCenterRef.current = loc
    }
  }

  // Watch user's real-world position and auto-center on first fix
  useEffect(() => {
    if (!navigator.geolocation) {
      setShowLocationBanner(true)
      if (!centeredRef.current) { centeredRef.current = true; flyToCenter(universityCoords) }
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        if (!centeredRef.current) { centeredRef.current = true; flyToCenter(loc) }
      },
      () => {
        setShowLocationBanner(true)
        if (!centeredRef.current) { centeredRef.current = true; flyToCenter(universityCoords) }
      },
      { enableHighAccuracy: true },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Subscribe to live pins from Firestore — stored in MapStore so DetailPanel can read them too
  useEffect(() => {
    if (!user?.university_id) return
    const unsubscribe = subscribeToPins(user.university_id, firestorePins => {
      const mapped: MockUserPin[] = firestorePins.map(pin => ({
        id: pin.id,
        type: pin.type as 'event' | 'volunteer' | 'help',
        title: pin.title,
        description: pin.description,
        lat: pin.lat,
        lng: pin.lng,
        userColor: pin.user_color,
        // TODO: Replace username display with real user lookup GET /users/{uid}
        username: pin.user_id,
        buzzReward: pin.buzz_reward,
        participantCount: pin.participant_count,
        createdAt: pin.created_at,
        eventDate: pin.event_date ?? null,
        volunteerHours: pin.volunteer_hours ?? null,
      }))
      setLivePins(mapped)
    })
    return unsubscribe
  }, [user?.university_id])

  const visibleUserPins = livePins.filter(p => activeFilters.includes(p.type))

  // Stable 3D assignment: based on pin ID so it never changes across filter toggles
  // ~50% of pins get 3D models; same pins always get 3D → no Canvas mount/unmount churn
  const pins3D = useMemo(() => {
    return new Set(visibleUserPins.filter(p => p.id.charCodeAt(0) % 2 === 0).map(p => p.id))
  }, [livePins])

  const zoomIn  = () => mapRef.current?.zoomIn({ duration: 300 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 300 })

  const locateMe = () => {
    mapRef.current?.flyTo({ center: [universityCoords.lng, universityCoords.lat], zoom: 15, duration: 1200 })
    setShowLocationBanner(true)
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
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      onMouseMove={e => {
        if (pinPlacementMode) setCursorPos({ x: e.clientX, y: e.clientY })
      }}
    >
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0;   }
        }
      `}</style>

      <Navbar />

      {/* Pin placement cursor overlay */}
      {pinPlacementMode && cursorPos && (
        <div style={{
          position: 'fixed',
          left: cursorPos.x - 12,
          top: cursorPos.y - 28,
          fontSize: 24,
          pointerEvents: 'none',
          zIndex: 500,
          userSelect: 'none',
          filter: !hoverInBounds ? 'hue-rotate(180deg) saturate(2)' : 'none',
          transition: 'filter 0.15s',
        }}>
          📍
        </div>
      )}

      {/* Out-of-bounds toast */}
      {outOfBoundsToast && (
        <div style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 600,
          padding: '10px 20px',
          borderRadius: 999,
          background: 'rgba(180,20,20,0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,80,80,0.4)',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          📍 That location is outside your campus zone
        </div>
      )}

      {/* Location banner — shows when GPS denied or after locate me click */}
      {showLocationBanner && (
        <div style={{
          position: 'absolute',
          top: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          borderRadius: 999,
          background: 'rgba(20,20,35,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            📍 Location set to {universityCoords.name}
          </span>
          <button
            onClick={() => setShowLocationBanner(false)}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Right-side map controls */}
      <div style={{
        position: 'absolute',
        bottom: 110,
        right: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <button style={mapControlBtn} onClick={zoomIn} title="Zoom in">+</button>
        <button style={mapControlBtn} onClick={zoomOut} title="Zoom out">−</button>
        <button style={mapControlBtn} onClick={locateMe} title="Locate me">📍</button>
        <button
          style={{
            ...mapControlBtn,
            fontWeight: 'bold',
            fontSize: 13,
            color: is3D ? '#fd8b00' : 'white',
            border: is3D ? '1px solid #fd8b00' : '1px solid rgba(255,255,255,0.15)',
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

      <Map
        ref={mapRef}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          latitude: universityCoords.lat,
          longitude: universityCoords.lng,
          zoom: 14,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onMouseMove={e => {
          if (!pinPlacementMode) return
          const map = mapRef.current?.getMap()
          if (!map) return
          const features = map.queryRenderedFeatures(e.point, { layers: ['poi-label'] })
          if (features.length > 0) {
            const feature = features[0]
            const placeName = feature.properties?.name ?? 'Unknown Place'
            const rawCategory = feature.properties?.category_en ?? feature.properties?.type ?? 'general'
            const category = mapboxCategoryToOurs(rawCategory)
            const coords = (feature.geometry as GeoJSON.Point).coordinates
            const [lng, lat] = coords
            setHoveredPlace({ name: placeName, category, lat, lng })
            setHoverInBounds(isWithinCampus(lat, lng, user?.university_id ?? 'other'))
          } else {
            setHoveredPlace(null)
            setHoverInBounds(true)
          }
        }}
        onClick={e => {
          // Placement mode intercept
          if (pinPlacementMode) {
            if (hoveredPlace) {
              if (!isWithinCampus(hoveredPlace.lat, hoveredPlace.lng, user?.university_id ?? 'other')) {
                // Show toast, stay in placement mode
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
                setOutOfBoundsToast(true)
                toastTimerRef.current = setTimeout(() => setOutOfBoundsToast(false), 2500)
              } else {
                setPinPlacementMode(false)
                setCreatePinContext({ lockedPlace: hoveredPlace })
              }
            }
            return
          }

          const map = mapRef.current?.getMap()
          if (!map) return

          const features = map.queryRenderedFeatures(e.point, { layers: ['poi-label'] })

          if (features.length === 0) {
            onMapClick?.(e.lngLat.lat, e.lngLat.lng)
            return
          }

          const feature = features[0]
          const placeName = feature.properties?.name ?? 'Unknown Place'
          const rawCategory = feature.properties?.category_en ?? feature.properties?.type ?? 'general'
          const category = mapboxCategoryToOurs(rawCategory)
          const coords = (feature.geometry as GeoJSON.Point).coordinates
          const [lng, lat] = coords

          // TODO: Replace with POST /places/find-or-create with { name, category, lat, lng, university_id }
          const mockPlace = {
            id: String(feature.id ?? placeName),
            name: placeName,
            category,
            lat,
            lng,
            posts: [],
          }

          setSelectedPlace(mockPlace)
        }}
        onLoad={() => {
          const map = mapRef.current?.getMap()
          if (!map) return
          map.on('mouseenter', 'poi-label', () => {
            if (!placementModeRef.current) map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', 'poi-label', () => {
            if (!placementModeRef.current) map.getCanvas().style.cursor = ''
          })
          onMapReady?.(() => {
            const center = mapRef.current?.getMap().getCenter()
            return { lat: center?.lat ?? universityCoords.lat, lng: center?.lng ?? universityCoords.lng }
          })
          // Apply any center that arrived before the map was ready
          if (pendingCenterRef.current) {
            mapRef.current?.flyTo({ center: [pendingCenterRef.current.lng, pendingCenterRef.current.lat], zoom: 15, duration: 1200 })
            pendingCenterRef.current = null
          } else if (!centeredRef.current) {
            // Map loaded before any GPS response — fly to university campus now,
            // GPS fix (if it arrives) will not override since centeredRef stays false
            // until the watchPosition callback fires
            mapRef.current?.flyTo({ center: [universityCoords.lng, universityCoords.lat], zoom: 15, duration: 1200 })
          }
        }}
      >
        {/* You are here dot */}
        {userLocation && (
          <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
            <div style={{ position: 'relative', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Pulsing ring */}
              <div style={{
                position: 'absolute',
                width: 20, height: 20,
                borderRadius: '50%',
                background: '#3B82F6',
                opacity: 0.5,
                animation: 'pulse-ring 1.6s ease-out infinite',
              }} />
              {/* Solid dot */}
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                background: '#3B82F6',
                border: '2px solid white',
                boxShadow: '0 0 6px rgba(59,130,246,0.8)',
                zIndex: 1,
              }} />
            </div>
          </Marker>
        )}

        {/* Preview marker during placement mode — orange in bounds, red out of bounds */}
        {pinPlacementMode && hoveredPlace && (
          <Marker latitude={hoveredPlace.lat} longitude={hoveredPlace.lng} anchor="bottom">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                width: 28, height: 28,
                borderRadius: '50%',
                background: hoverInBounds ? '#fd8b00' : '#dc2020',
                opacity: 0.35,
                animation: 'pulse-ring 1.2s ease-out infinite',
              }} />
              <div style={{
                fontSize: 26,
                filter: hoverInBounds
                  ? 'drop-shadow(0 2px 6px rgba(253,139,0,0.7))'
                  : 'drop-shadow(0 2px 6px rgba(220,32,32,0.8)) hue-rotate(180deg) saturate(2)',
                transition: 'filter 0.15s',
              }}>📍</div>
            </div>
          </Marker>
        )}

        {spreadOverlappingPins(visibleUserPins).map((pin) => (
          <Marker key={pin.id} latitude={pin.renderLat} longitude={pin.renderLng} anchor="bottom">
            <AvatarMarker
              userColor={pin.userColor}
              type={pin.type}
              modelPath={PIN_MODEL[pin.type] ?? '/red.glb'}
              show3D={pins3D.has(pin.id)}
              onClick={() => setSelectedPin(pin)}
            />
          </Marker>
        ))}

        {/* Geofence overlay — red tint outside campus radius, only for restricted accounts, hidden in 3D */}
        {geofenceGeoJSON && !is3D && (
          <Source id="geofence" type="geojson" data={geofenceGeoJSON}>
            <Layer
              id="geofence-fill"
              type="fill"
              paint={{ 'fill-color': '#ff0000', 'fill-opacity': 0.18 }}
            />
            <Layer
              id="geofence-border"
              type="line"
              paint={{
                'line-color': '#ff4444',
                'line-width': 1.5,
                'line-dasharray': [3, 3],
                'line-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {/* Geofence circle border — always visible in 3D mode so boundary is clear */}
        {circleLineGeoJSON && is3D && (
          <Source id="geofence-circle" type="geojson" data={circleLineGeoJSON}>
            <Layer
              id="geofence-circle-line"
              type="line"
              paint={{
                'line-color': '#ff4444',
                'line-width': 2,
                'line-dasharray': [4, 3],
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

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
    </div>
  )
}
