import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useMapStore } from '../store/useMapStore'
import type { Pin } from '../store/useMapStore'
import { mockPlaces } from '../data/mockPins'
import type { MockPlace } from '../store/useMapStore'
import { getTheme } from '../utils/themes'

const FILTER_OPTIONS = [
  { key: 'event',     label: 'Events',    icon: '📅' },
  { key: 'volunteer', label: 'Volunteer', icon: '🤝' },
  { key: 'help',      label: 'Help',      icon: '🆘' },
  { key: 'places',    label: 'Places',    icon: '📍' },
]

const PIN_COLORS: Record<string, string> = {
  event:     '#3B82F6',
  volunteer: '#22C55E',
  help:      '#F59E0B',
  business:  '#A855F7',
}

const PIN_ICONS: Record<string, string> = {
  event:     '📅',
  volunteer: '🤝',
  help:      '🆘',
  business:  '🏷️',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function FeedPage() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const { pins, activeFilters, toggleFilter } = useMapStore()
  const universityId = user?.university_id ?? 'other'
  const theme = getTheme(universityId)
  const primary = theme.primary

  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<MockPlace | null>(null)
  const [joined, setJoined] = useState<Record<string, boolean>>({})

  const visiblePins = pins.filter(p => activeFilters.includes(p.type))
  const visiblePlaces = mockPlaces.filter(() => activeFilters.includes('places'))

  const handleBack = () => {
    setSelectedPin(null)
    setSelectedPlace(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>

      {/* Top bar */}
      <div
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-50"
        style={{
          background: 'rgba(15,15,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={() => selectedPin || selectedPlace ? handleBack() : navigate('/map')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          ←
        </button>

        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: 'white' }}>Buzz</span>
          <span style={{ color: primary }}>On</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Campus</span>
        </div>

        <div className="flex-1" />

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
          style={{ background: `${primary}33`, color: primary, border: `1px solid ${primary}55` }}
        >
          🪙 {user?.buzz_balance ?? 0} Buzz
        </div>
      </div>

      {/* LIST VIEW */}
      {!selectedPin && !selectedPlace && (
        <>
          <div className="px-6 pt-6 pb-2">
            <h1 className="text-white font-extrabold text-2xl mb-1">Campus Feed</h1>
            <p className="text-sm" style={{ color: '#888' }}>
              {visiblePins.length + visiblePlaces.length} items near you
            </p>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-6 py-3 overflow-x-auto">
            {FILTER_OPTIONS.map(f => {
              const active = activeFilters.includes(f.key)
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0"
                  style={{
                    background: active ? primary : 'rgba(255,255,255,0.07)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    border: `1.5px solid ${active ? primary : 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  <span>{f.icon}</span>
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="px-6 pb-10 flex flex-col gap-3">
            {/* Pins */}
            {visiblePins.map(pin => (
              <button
                key={pin.id}
                onClick={() => setSelectedPin(pin)}
                className="w-full text-left p-4 rounded-2xl transition-all hover:brightness-110"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex gap-4 items-start">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${PIN_COLORS[pin.type]}22` }}
                  >
                    {PIN_ICONS[pin.type]}
                  </div>

                  <div className="flex-1">
                    <span
                      className="text-xs font-bold uppercase px-2 py-0.5 rounded-full text-white mb-2 inline-block"
                      style={{ background: PIN_COLORS[pin.type] }}
                    >
                      {pin.type}
                    </span>

                    <h3 className="text-white font-bold text-base mb-1">{pin.title}</h3>
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: '#aaa' }}>
                      {pin.description}
                    </p>

                    <div className="flex flex-col gap-1 mb-3">
                      {pin.event_date && (
                        <span className="text-xs" style={{ color: '#888' }}>
                          🕐 {formatDate(pin.event_date)}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#666' }}>
                        Posted {timeAgo(pin.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#888' }}>
                        👥 {pin.participant_count} {pin.type === 'help' ? 'helpers' : 'joined'}
                      </span>
                      <span className="text-sm font-bold" style={{ color: primary }}>
                        🪙 {pin.buzz_reward} Buzz
                      </span>
                    </div>
                  </div>

                  <span className="text-white/30 text-lg shrink-0">›</span>
                </div>
              </button>
            ))}

            {/* Places */}
            {visiblePlaces.map(place => (
              <button
                key={place.id}
                onClick={() => setSelectedPlace(place)}
                className="w-full text-left p-4 rounded-2xl transition-all hover:brightness-110"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex gap-4 items-start">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: '#8B5CF622' }}
                  >
                    📍
                  </div>
                  <div className="flex-1">
                    <span
                      className="text-xs font-bold uppercase px-2 py-0.5 rounded-full text-white mb-2 inline-block"
                      style={{ background: '#8B5CF6' }}
                    >
                      {place.category}
                    </span>
                    <h3 className="text-white font-bold text-base mb-1">{place.name}</h3>
                    <p className="text-sm" style={{ color: '#888' }}>
                      {place.posts.length} posts · Active Hub
                    </p>
                  </div>
                  <span className="text-white/30 text-lg shrink-0">›</span>
                </div>
              </button>
            ))}

            {/* Empty state */}
            {visiblePins.length === 0 && visiblePlaces.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="text-white font-bold text-lg mb-1">Nothing to show</p>
                <p className="text-sm" style={{ color: '#888' }}>Try enabling some filters above</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* PIN DETAIL VIEW */}
      {selectedPin && (
        <div className="px-6 pb-10 flex flex-col gap-4 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
              style={{ background: PIN_COLORS[selectedPin.type] }}
            >
              {PIN_ICONS[selectedPin.type]} {selectedPin.type}
            </span>
          </div>

          <h2 className="text-white font-extrabold text-2xl">{selectedPin.title}</h2>

          {/* Posted by */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: selectedPin.user_color }}
            >
              ●
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Campus Member</p>
              <p className="text-xs" style={{ color: '#888' }}>Posted {timeAgo(selectedPin.created_at)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl" style={{ background: '#1a1a2e' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>
              {selectedPin.description}
            </p>
          </div>

          {/* Date */}
          {selectedPin.event_date && (
            <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: '#1a1a2e', borderLeft: `3px solid ${primary}` }}>
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs font-bold uppercase mb-0.5" style={{ color: '#888' }}>Date & Time</p>
                <p className="text-white font-bold">{formatDate(selectedPin.event_date)}</p>
              </div>
            </div>
          )}

          {/* Buzz reward */}
          <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: '#1a1a2e', borderLeft: `3px solid ${primary}` }}>
            <span className="text-2xl">🪙</span>
            <div>
              <p className="text-xs font-bold uppercase mb-0.5" style={{ color: '#888' }}>Buzz Reward</p>
              <p className="font-extrabold text-lg" style={{ color: primary }}>
                {selectedPin.buzz_reward} Buzz Points
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="p-4 rounded-2xl" style={{ background: '#1a1a2e' }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: '#888' }}>
              {selectedPin.participant_count} {selectedPin.type === 'help' ? 'helpers' : 'people joined'}
            </p>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(selectedPin.participant_count, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    background: ['#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EC4899','#F97316','#EAB308','#CC0000'][i % 8],
                    borderColor: '#0f0f1a',
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {selectedPin.participant_count > 8 && (
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: '#444', borderColor: '#0f0f1a' }}
                >
                  +{selectedPin.participant_count - 8}
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => setJoined(j => ({ ...j, [selectedPin.id]: !j[selectedPin.id] }))}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all"
            style={{
              background: joined[selectedPin.id] ? 'rgba(255,255,255,0.08)' : primary,
              color: joined[selectedPin.id] ? primary : 'white',
              border: joined[selectedPin.id] ? `2px solid ${primary}` : 'none',
            }}
          >
            {joined[selectedPin.id]
              ? '✓ Registered!'
              : selectedPin.type === 'help'
                ? 'Offer Help'
                : selectedPin.type === 'volunteer'
                  ? 'Sign Up to Volunteer'
                  : 'Join Event'}
          </button>
        </div>
      )}

      {/* PLACE DETAIL VIEW */}
      {selectedPlace && (
        <div className="px-6 pb-10 pt-4 flex flex-col gap-4">
          <span
            className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white inline-block w-fit"
            style={{ background: '#8B5CF6' }}
          >
            📍 {selectedPlace.category}
          </span>
          <h2 className="text-white font-extrabold text-2xl">{selectedPlace.name}</h2>
          <p className="text-sm font-bold uppercase" style={{ color: primary }}>● Active Hub</p>

          {selectedPlace.posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-white font-bold">No posts yet</p>
              <p className="text-sm mt-1" style={{ color: '#888' }}>Be the first to post here!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedPlace.posts.map(post => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl"
                  style={{ background: '#1a1a2e', borderLeft: `3px solid ${primary}` }}
                >
                  <span
                    className="text-xs font-bold uppercase px-2 py-0.5 rounded-full mb-2 inline-block"
                    style={{ background: `${primary}22`, color: primary }}
                  >
                    {post.type}
                  </span>
                  {post.title && <p className="text-white font-bold text-sm mt-1">{post.title}</p>}
                  {post.body && <p className="text-sm mt-1" style={{ color: '#aaa' }}>{post.body}</p>}
                  {post.buzzCost && (
                    <p className="text-sm font-bold mt-2" style={{ color: primary }}>
                      🪙 {post.buzzCost} Buzz to redeem
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
