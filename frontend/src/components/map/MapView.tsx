import { useRef, useState } from 'react'
import Map, { Marker, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import AvatarMarker from './AvatarMarker'

interface MapViewProps {
  onMapClick?: (lat: number, lng: number) => void
}

export default function MapView({ onMapClick }: MapViewProps) {
  const [is3D, setIs3D] = useState(false)
  const mapRef = useRef<MapRef>(null)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <button
        onClick={() => {
          const newPitch = is3D ? 0 : 60
          mapRef.current?.easeTo({ pitch: newPitch, duration: 1000 })
          setIs3D(!is3D)
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 999,
          padding: '8px 16px',
          background: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {is3D ? '2D' : '3D'}
      </button>

      <Map
        ref={mapRef}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          latitude: 41.1066,
          longitude: -80.6506,
          zoom: 14,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={e => onMapClick?.(e.lngLat.lat, e.lngLat.lng)}
      >
        <Marker latitude={41.1066} longitude={-80.6506}>
          <AvatarMarker />
        </Marker>

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
