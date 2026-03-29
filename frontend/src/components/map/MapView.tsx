// import { useRef, useState } from 'react'
// import Map, { Marker, Layer } from 'react-map-gl'
// import type { MapRef } from 'react-map-gl'
// import 'mapbox-gl/dist/mapbox-gl.css'
// import AvatarMarker from './AvatarMarker'
// import PlaceMarker from './PlaceMarker'
// import Navbar from '../ui/Navbar'
// import PostPinModal from '../pins/PostPinModal'
// import { useMapStore } from '../../store/useMapStore'
// import { mockUserPins, mockPlaces } from '../../data/mockPins'

// interface MapViewProps {
//   onMapClick?: (lat: number, lng: number) => void
// }

// export default function MapView({ onMapClick }: MapViewProps) {
//   const [is3D, setIs3D] = useState(false)
//   const [modalOpen, setModalOpen] = useState(false)
//   const mapRef = useRef<MapRef>(null)
//   const { activeFilters, setSelectedPin, setSelectedPlace } = useMapStore()

//   const visibleUserPins = mockUserPins.filter(p => activeFilters.includes(p.type))
//   const visiblePlaces = mockPlaces.filter(() => activeFilters.includes('places'))

//   const zoomIn = () => mapRef.current?.zoomIn({ duration: 300 })
//   const zoomOut = () => mapRef.current?.zoomOut({ duration: 300 })

//   const locateMe = () => {
//     navigator.geolocation.getCurrentPosition(pos => {
//       mapRef.current?.flyTo({
//         center: [pos.coords.longitude, pos.coords.latitude],
//         zoom: 15,
//         duration: 1200,
//       })
//     })
//   }

//   const mapControlBtn = {
//     width: 40,
//     height: 40,
//     background: 'rgba(0,0,0,0.75)',
//     border: '1px solid rgba(255,255,255,0.15)',
//     borderRadius: 10,
//     display: 'flex' as const,
//     alignItems: 'center' as const,
//     justifyContent: 'center' as const,
//     cursor: 'pointer',
//     color: 'white',
//     fontSize: 18,
//     backdropFilter: 'blur(8px)',
//   }

//   return (
//     <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

//       <Navbar />

//       {/* Right-side map controls */}
//       <div style={{
//         position: 'absolute',
//         bottom: 110,
//         right: 20,
//         zIndex: 999,
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 8,
//       }}>
//         <button style={mapControlBtn} onClick={zoomIn} title="Zoom in">+</button>
//         <button style={mapControlBtn} onClick={zoomOut} title="Zoom out">−</button>
//         <button style={mapControlBtn} onClick={locateMe} title="Locate me">📍</button>
//         <button
//           style={{
//             ...mapControlBtn,
//             fontWeight: 'bold',
//             fontSize: 13,
//             color: is3D ? '#fd8b00' : 'white',
//             border: is3D
//               ? '1px solid #fd8b00'
//               : '1px solid rgba(255,255,255,0.15)',
//           }}
//           onClick={() => {
//             const newPitch = is3D ? 0 : 60
//             mapRef.current?.easeTo({ pitch: newPitch, duration: 1000 })
//             setIs3D(!is3D)
//           }}
//         >
//           {is3D ? '2D' : '3D'}
//         </button>
//       </div>

//       {/* Bottom — single Drop a Buzz button */}
//       <div style={{
//         position: 'fixed',
//         bottom: 32,
//         left: '50%',
//         transform: 'translateX(-50%)',
//         zIndex: 999,
//       }}>
//         <button
//           onClick={() => setModalOpen(true)}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: 10,
//             padding: '14px 32px',
//             borderRadius: 999,
//             border: 'none',
//             background: '#efa00b',
//             cursor: 'pointer',
//             boxShadow: '0 8px 32px rgba(253,139,0,0.4)',
//             transition: 'all 0.2s',
//           }}
//         >
//           <span style={{ fontSize: 22 }}></span>
//           <span style={{
//             fontSize: 16,
//             fontWeight: 'bold',
//             color: 'white',
//             fontFamily: 'Manrope, sans-serif',
//             letterSpacing: '0.03em',
//           }}>
//             Drop a Buzz
//           </span>
//         </button>
//       </div>

//       <Map
//         ref={mapRef}
//         mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
//         initialViewState={{
//           latitude: 41.1006,
//           longitude: -80.6481,
//           zoom: 14,
//           pitch: 0,
//           bearing: 0,
//         }}
//         mapStyle="mapbox://styles/mapbox/dark-v11"
//         onClick={e => onMapClick?.(e.lngLat.lat, e.lngLat.lng)}
//       >
//         {visibleUserPins.map(pin => (
//           <Marker key={pin.id} latitude={pin.lat} longitude={pin.lng} anchor="bottom">
//             <AvatarMarker
//               userColor={pin.userColor}
//               type={pin.type}
//               onClick={() => setSelectedPin(pin)}
//             />
//           </Marker>
//         ))}

//         {visiblePlaces.map(place => (
//           <Marker key={place.id} latitude={place.lat} longitude={place.lng} anchor="bottom">
//             <PlaceMarker
//               category={place.category}
//               name={place.name}
//               onClick={() => setSelectedPlace(place)}
//             />
//           </Marker>
//         ))}

//         <Layer
//           id="3d-buildings"
//           source="composite"
//           source-layer="building"
//           filter={['==', 'extrude', 'true']}
//           type="fill-extrusion"
//           minzoom={15}
//           paint={{
//             'fill-extrusion-color': '#aaa',
//             'fill-extrusion-height': ['get', 'height'],
//             'fill-extrusion-opacity': 0.6,
//           }}
//         />
//       </Map>

//       <PostPinModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
//     </div>
//   )
// }

import { useMapStore } from '../../store/useMapStore'
import { useAuthStore } from '../../store/useAuthStore'
import type { MockPlacePost } from '../../store/useMapStore'

const UNIVERSITY_THEMES: Record<string, string> = {
  ysu: '#CC0000',
  kent: '#002664',
  osu: '#BB0000',
  other: '#1985a1',
}

const PIN_LABELS: Record<string, string> = {
  event: 'EVENT',
  volunteer: 'VOLUNTEER',
  help: 'HELP',
}

function DealCard({ post, primary }: { post: MockPlacePost; primary: string }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a', borderLeft: `3px solid ${primary}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ background: `${primary}22`, color: primary }}>
          ⚡ FLASH DEAL
        </span>
        <span className="text-xs" style={{ color: '#888' }}>Ends in {post.expiresIn}</span>
      </div>
      <p className="text-white font-bold text-sm mb-1">{post.title}</p>
      {post.body && <p className="text-sm mb-3" style={{ color: '#aaa' }}>{post.body}</p>}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: primary }}>🪙 {post.buzzCost} Buzz to redeem</span>
      </div>
      <button
        className="w-full py-2.5 rounded-lg font-bold text-white text-sm"
        style={{ background: primary }}
      >
        REDEEM NOW
      </button>
    </div>
  )
}

function EventCard({ post, primary }: { post: MockPlacePost; primary: string }) {
  const [month, day] = (post.eventDate ?? 'Oct 1').split(' ')
  return (
    <div className="rounded-xl p-4 mb-3 flex gap-3" style={{ background: '#0f0f1a', borderLeft: `3px solid ${primary}` }}>
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 shrink-0"
        style={{ background: `${primary}22` }}>
        <span className="text-xs font-bold uppercase" style={{ color: primary }}>{month}</span>
        <span className="text-2xl font-extrabold text-white leading-none">{day}</span>
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded mb-1 inline-block"
          style={{ background: `${primary}22`, color: primary }}>LIVE EVENT</span>
        <p className="text-white font-bold text-sm">{post.title}</p>
        {post.body && <p className="text-xs mt-1" style={{ color: '#aaa' }}>{post.body}</p>}
      </div>
    </div>
  )
}

function AnnouncementCard({ post }: { post: MockPlacePost }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📢</span>
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded"
          style={{ background: '#ffffff15', color: '#aaa' }}>CAMPUS UPDATE</span>
      </div>
      <p className="text-white font-bold text-sm">{post.title}</p>
    </div>
  )
}

function ReviewCard({ post }: { post: MockPlacePost }) {
  const stars = post.rating ?? 0
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: '#fd8b00' }}>
          {post.username?.[0] ?? 'U'}
        </div>
        <span className="text-sm font-semibold text-white">{post.username}</span>
        <span className="ml-auto text-yellow-400 text-sm">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
      {post.body && <p className="text-sm italic" style={{ color: '#ccc' }}>"{post.body}"</p>}
    </div>
  )
}

function PostCard({ post, primary }: { post: MockPlacePost; primary: string }) {
  if (post.type === 'deal') return <DealCard post={post} primary={primary} />
  if (post.type === 'event') return <EventCard post={post} primary={primary} />
  if (post.type === 'announcement') return <AnnouncementCard post={post} />
  if (post.type === 'review') return <ReviewCard post={post} />
  return null
}

export default function DetailPanel() {
  const { selectedPin, selectedPlace, setSelectedPin, setSelectedPlace } = useMapStore()
  const user = useAuthStore(state => state.user)

  const universityId = user?.university_id ?? 'other'
  const primary = UNIVERSITY_THEMES[universityId] ?? UNIVERSITY_THEMES.other

  const isOpen = selectedPin !== null || selectedPlace !== null

  const close = () => {
    setSelectedPin(null)
    setSelectedPlace(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 120,
        right: 0,
        bottom: 0,
        width: 360,
        background: '#1a1a2e',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        borderTopLeftRadius: 16,
        overflowY: 'auto',
      }}
    >
      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white z-10"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        ✕
      </button>

      {/* PIN CONTENT */}
      {selectedPin && (
        <div className="flex flex-col h-full p-6">
          {/* Type badge */}
          <div className="mb-4 mt-2">
            <span
              className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
              style={{ background: primary }}
            >
              {PIN_LABELS[selectedPin.type]}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-white font-extrabold text-xl mb-2">{selectedPin.title}</h2>

          {/* Username */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: selectedPin.userColor }}
            />
            <span className="text-sm font-semibold" style={{ color: '#aaa' }}>
              @{selectedPin.username} · {selectedPin.createdAt}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#ccc' }}>
            {selectedPin.description}
          </p>

          {/* Buzz reward */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: '#0f0f1a' }}>
            <span className="text-xl">🪙</span>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#888' }}>Buzz Reward</p>
              <p className="font-extrabold text-lg" style={{ color: primary }}>
                {selectedPin.buzzReward} Buzz Points
              </p>
            </div>
          </div>

          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Participant count */}
          <p className="text-sm mb-6" style={{ color: '#aaa' }}>
            👥 {selectedPin.participantCount} {selectedPin.participantCount === 1 ? 'person' : 'people'} joined
          </p>

          {/* Action button */}
          <div className="mt-auto">
            <button
              className="w-full py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: primary }}
            >
              {selectedPin.type === 'help' ? 'Accept & Help' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {/* PLACE CONTENT */}
      {selectedPlace && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mt-2 mb-2">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
                style={{ background: primary }}>
                {selectedPlace.category}
              </span>
            </div>
            <h2 className="text-white font-extrabold text-xl mt-3 mb-1">{selectedPlace.name}</h2>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primary }}>
              ● ACTIVE HUB
            </p>
          </div>

          {/* Posts list — scrollable */}
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {selectedPlace.posts.length === 0 ? (
              <p className="text-center text-sm mt-8" style={{ color: '#888' }}>
                No posts yet. Be the first to post here!
              </p>
            ) : (
              selectedPlace.posts.map(post => (
                <PostCard key={post.id} post={post} primary={primary} />
              ))
            )}
          </div>

          {/* POST HERE button — fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(to top, #1a1a2e 80%, transparent)' }}>
            <button
              className="w-full py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: primary }}
            >
              + POST HERE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}