import { useState } from 'react'

interface PostPinModalProps {
  isOpen: boolean
  onClose: () => void
}

const PIN_TYPES = [
  { key: 'event',        icon: '📅', label: 'Event',        color: '#3B82F6' },
  { key: 'volunteer',    icon: '🤝', label: 'Volunteer',    color: '#22C55E' },
  { key: 'help',         icon: '👋', label: 'Help',         color: '#F59E0B' },
  { key: 'deal',         icon: '🏷️', label: 'Deal',         color: '#fd8b00' },
  { key: 'announcement', icon: '📢', label: 'Announce',     color: '#9CA3AF' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  outline: 'none',
  background: 'rgba(255,255,255,0.07)',
  color: 'white',
  fontSize: 13,
  fontFamily: 'Inter, system-ui, sans-serif',
}

export default function PostPinModal({ isOpen, onClose }: PostPinModalProps) {
  const [step, setStep]               = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate]     = useState('')
  const [eventTime, setEventTime]     = useState('')
  const [buzzCost, setBuzzCost]       = useState('')
  const [hours, setHours]             = useState('')

  const reset = () => {
    setStep(1)
    setSelectedType(null)
    setTitle('')
    setDescription('')
    setEventDate('')
    setEventTime('')
    setBuzzCost('')
    setHours('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = () => {
    // TODO: Call POST /pins with form data, close modal, add pin to map via useMapStore
    console.log('Submitting pin:', { type: selectedType, title, description, eventDate, eventTime, buzzCost, hours })
    handleClose()
  }

  const selectedTypeMeta = PIN_TYPES.find(t => t.key === selectedType)

  return (
    <>
      {/* Overlay — semi-transparent, map visible underneath */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 200ms ease-out',
        }}
      />

      {/* Compact floating modal */}
      <div
        style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: isOpen
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(12px)',
          width: '90vw',
          maxWidth: 480,
          background: 'rgba(20,20,35,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '16px 20px 20px',
          zIndex: 50,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-base">Drop a Buzz</span>
              <button onClick={handleClose} style={{ color: '#888', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            {/* TODO: Replace with reverse geocode of map center */}
            <p className="mb-4" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fd8b00' }}>
              📍 Current Location: Campus
            </p>

            {/* Type icon grid — single row */}
            <div className="flex justify-between mb-5">
              {PIN_TYPES.map(t => {
                const active = selectedType === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedType(t.key)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: active ? `${t.color}33` : 'rgba(255,255,255,0.07)',
                        border: active ? `2px solid ${t.color}` : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        position: 'relative',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t.icon}
                      {active && (
                        <div style={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: t.color,
                          fontSize: 9,
                          color: 'white',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>✓</div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: active ? t.color : '#aaa', fontWeight: 600 }}>
                      {t.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button onClick={handleClose} style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: selectedType ? 'pointer' : 'not-allowed',
                  background: selectedType
                    ? 'linear-gradient(135deg, #fd8b00, #8c4a00)'
                    : 'rgba(255,255,255,0.08)',
                  color: selectedType ? 'white' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} style={{ color: '#888', fontSize: 16 }}>←</button>
                <span className="text-white font-bold text-base">
                  {selectedTypeMeta?.icon} {selectedTypeMeta?.label}
                </span>
              </div>
              <button onClick={handleClose} style={{ color: '#888', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {/* Title */}
              <input
                style={inputStyle}
                type="text"
                placeholder="Give it a title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />

              {/* Description */}
              <textarea
                style={{ ...inputStyle, resize: 'none', minHeight: 72 }}
                placeholder="What's happening..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />

              {/* Event / Volunteer — date + time side by side */}
              {(selectedType === 'event' || selectedType === 'volunteer') && (
                <div className="flex gap-2">
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                  />
                </div>
              )}

              {/* Volunteer — hours */}
              {selectedType === 'volunteer' && (
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Volunteer hours (e.g. 2)"
                  min={1}
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                />
              )}

              {/* Deal — buzz cost */}
              {selectedType === 'deal' && (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🪙</span>
                  <input
                    style={{ ...inputStyle, paddingLeft: 36 }}
                    type="number"
                    placeholder="Buzz Points to redeem"
                    min={1}
                    value={buzzCost}
                    onChange={e => setBuzzCost(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>
                ← Back
              </button>
              {/* TODO: Call POST /pins with form data, close modal, add pin to map via useMapStore */}
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  background: title.trim()
                    ? 'linear-gradient(135deg, #fd8b00, #8c4a00)'
                    : 'rgba(255,255,255,0.08)',
                  color: title.trim() ? 'white' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                Post to Map 🚀
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
