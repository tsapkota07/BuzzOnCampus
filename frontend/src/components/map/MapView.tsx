import { useRef, useState } from 'react'
import Map, { Marker, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import AvatarMarker from './AvatarMarker'
import PlaceMarker from './PlaceMarker'
import Navbar from '../ui/Navbar'
import { useMapStore } from '../../store/useMapStore'
import { mockUserPins, mockPlaces } from '../../data/mockPins'

interface MapViewProps {
  onMapClick?: (lat: number, lng: number) => void
}

export default function MapView({ onMapClick }: MapViewProps) {
  const [is3D, setIs3D] = useState(false)
  const mapRef = useRef<MapRef>(null)
  const { activeFilters, setSelectedPin, setSelectedPlace } = useMapStore()

  const visibleUserPins = mockUserPins.filter(p => activeFilters.includes(p.type))
  const visiblePlaces   = mockPlaces.filter(() => activeFilters.includes('places'))

  const zoomIn  = () => mapRef.current?.zoomIn({ duration: 300 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 300 })

  const locateMe = () => {
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

      <Navbar />

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
          latitude: 41.1006,
          longitude: -80.6481,
          zoom: 14,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={e => onMapClick?.(e.lngLat.lat, e.lngLat.lng)}
      >
        {visibleUserPins.map(pin => (
          <Marker key={pin.id} latitude={pin.lat} longitude={pin.lng} anchor="bottom">
            <AvatarMarker
              userColor={pin.userColor}
              type={pin.type}
              onClick={() => setSelectedPin(pin)}
            />
          </Marker>
        ))}

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
    </div>
  )
}
