import { useState, useEffect, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../api/firebase'
import { useMapStore } from '../../store/useMapStore'
import type { MockPlacePost } from '../../store/useMapStore'
import { createPin, updatePin, deletePin } from '../../api/pins'
import { useAuthStore } from '../../store/useAuthStore'
import { isRestrictedAccount, isWithinCampus } from '../../utils/universityCoords'
import { getAdminInfo } from '../../api/admin'

// ─── Constants ───────────────────────────────────────────────────────────────

const PIN_COLORS: Record<string, string> = {
  event: '#3B82F6',
  volunteer: '#22C55E',
  help: '#F59E0B',
}

const PIN_LABELS: Record<string, string> = {
  event: 'EVENT',
  volunteer: 'VOLUNTEER',
  help: 'HELP',
}

const PIN_TYPES = [
  { key: 'event',        icon: '📅', label: 'Event',     color: '#3B82F6' },
  { key: 'volunteer',    icon: '🤝', label: 'Volunteer', color: '#22C55E' },
  { key: 'help',         icon: '👋', label: 'Help',      color: '#F59E0B' },
  { key: 'deal',         icon: '🏷️', label: 'Deal',      color: '#fd8b00' },
  { key: 'announcement', icon: '📢', label: 'Announce',  color: '#9CA3AF' },
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

// ─── Place post cards ─────────────────────────────────────────────────────────

function DealCard({ post }: { post: MockPlacePost }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#0f0f1a', borderLeft: '3px solid #F59E0B' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ background: '#F59E0B22', color: '#F59E0B' }}>
          ⚡ FLASH DEAL
        </span>
        <span className="text-xs" style={{ color: '#888' }}>Ends in {post.expiresIn}</span>
      </div>
      <p className="text-white font-bold text-sm mb-1">{post.title}</p>
      {post.body && <p className="text-sm mb-3" style={{ color: '#aaa' }}>{post.body}</p>}
      <span className="text-sm font-bold" style={{ color: '#fd8b00' }}>🪙 {post.buzzCost} Buzz to redeem</span>
    </div>
  )
}

function EventCard({ post }: { post: MockPlacePost }) {
  const [month, day] = (post.eventDate ?? 'Oct 1').split(' ')
  return (
    <div className="rounded-xl p-4 mb-3 flex gap-3" style={{ background: '#0f0f1a', borderLeft: '3px solid #3B82F6' }}>
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 shrink-0" style={{ background: '#3B82F622' }}>
        <span className="text-xs font-bold uppercase" style={{ color: '#3B82F6' }}>{month}</span>
        <span className="text-2xl font-extrabold text-white leading-none">{day}</span>
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded mb-1 inline-block" style={{ background: '#3B82F622', color: '#3B82F6' }}>LIVE EVENT</span>
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
        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ background: '#ffffff15', color: '#aaa' }}>CAMPUS UPDATE</span>
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
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#fd8b00' }}>
          {post.username?.[0] ?? 'U'}
        </div>
        <span className="text-sm font-semibold text-white">{post.username}</span>
        <span className="ml-auto text-yellow-400 text-sm">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
      {post.body && <p className="text-sm italic" style={{ color: '#ccc' }}>"{post.body}"</p>}
    </div>
  )
}

function PostCard({ post }: { post: MockPlacePost }) {
  if (post.type === 'deal') return <DealCard post={post} />
  if (post.type === 'event') return <EventCard post={post} />
  if (post.type === 'announcement') return <AnnouncementCard post={post} />
  if (post.type === 'review') return <ReviewCard post={post} />
  return null
}

// ─── Time helper ─────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Haversine distance ───────────────────────────────────────────────────────

function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Create Pin Form (inline in panel) ───────────────────────────────────────

function CreatePinForm() {
  const user = useAuthStore(state => state.user)
  const { createPinContext, setCreatePinContext } = useMapStore()

  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [buzzCost, setBuzzCost] = useState('')
  const [hours, setHours] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const lockedPlace = createPinContext?.lockedPlace
  const selectedTypeMeta = PIN_TYPES.find(t => t.key === selectedType)

  const pinLat = lockedPlace?.lat ?? createPinContext?.mapCenter?.lat ?? 0
  const pinLng = lockedPlace?.lng ?? createPinContext?.mapCenter?.lng ?? 0
  const outOfBounds = isRestrictedAccount(user?.university_id ?? 'other')
    && !isWithinCampus(pinLat, pinLng, user?.university_id ?? 'other')

  const cancel = () => setCreatePinContext(null)

  const handleSubmit = async () => {
    if (!user) { setPostError('Not logged in'); return }
    if (!selectedType) return

    // Phase 11 — CRITICAL: input length limits (XSS / oversized payloads)
    const trimmedTitle = title.trim().slice(0, 100)
    const trimmedDesc = description.trim().slice(0, 500)
    if (!trimmedTitle) { setPostError('Title is required'); return }

    // Phase 11 — CRITICAL: buzzCost must be 0 or within 1–1000
    const buzzNum = buzzCost ? Number(buzzCost) : 0
    if (buzzCost && (isNaN(buzzNum) || buzzNum < 1 || buzzNum > 1000)) {
      setPostError('Buzz Points must be between 1 and 1000')
      return
    }

    // Phase 11 — HIGH: volunteer hours must be 1–12
    const hoursNum = hours ? Number(hours) : null
    if (selectedType === 'volunteer' && hoursNum !== null && (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 12)) {
      setPostError('Volunteer hours must be between 1 and 12')
      return
    }

    // Phase 11 — HIGH: require a valid location — never silently default to 0,0
    const lat = lockedPlace?.lat ?? createPinContext?.mapCenter?.lat
    const lng = lockedPlace?.lng ?? createPinContext?.mapCenter?.lng
    if (lat === undefined || lng === undefined) {
      setPostError('No location set — please re-open the form from the map')
      return
    }

    const event_date = eventDate
      ? eventTime ? `${eventDate}T${eventTime}` : eventDate
      : null

    setIsPosting(true)
    setPostError(null)
    try {
      await createPin({
        user_id: user.uid,
        // Phase 11 — MEDIUM: cache username in pin doc so deleted accounts don't show UID
        username: (user as any).username ?? user.email ?? user.uid,
        user_color: user.color,
        avatar_model: user.avatar_url ?? '/models/red.glb',
        type: selectedType as 'event' | 'volunteer' | 'help',
        title: trimmedTitle,
        description: trimmedDesc,
        buzz_reward: buzzNum,
        volunteer_hours: selectedType === 'volunteer' ? (hoursNum ?? null) : null,
        lat,
        lng,
        university_id: user.university_id,
        event_date,
      })
      setCreatePinContext(null)
    } catch (err) {
      console.error('Failed to post pin:', err)
      setPostError('Failed to post, try again')
      setIsPosting(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-5 overflow-y-auto">

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <div className="flex items-center justify-between mb-1 mt-2">
            <span className="text-white font-bold text-base">Drop a Buzz</span>
          </div>

          <p className="mb-4" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fd8b00' }}>
            📍 {lockedPlace ? `At: ${lockedPlace.name}` : 'Current map view'}
          </p>

          {/* Type grid */}
          <div className="flex justify-between mb-6">
            {PIN_TYPES.map(t => {
              const active = selectedType === t.key
              return (
                <button key={t.key} onClick={() => setSelectedType(t.key)} className="flex flex-col items-center gap-1.5">
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: active ? `${t.color}33` : 'rgba(255,255,255,0.07)',
                    border: active ? `2px solid ${t.color}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, position: 'relative', transition: 'all 0.15s',
                  }}>
                    {t.icon}
                    {active && (
                      <div style={{
                        position: 'absolute', bottom: -4, right: -4,
                        width: 16, height: 16, borderRadius: '50%',
                        background: t.color, fontSize: 9, color: 'white',
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✓</div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: active ? t.color : '#aaa', fontWeight: 600 }}>{t.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <button onClick={cancel} style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>Cancel</button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedType}
              style={{
                padding: '8px 20px', borderRadius: 999, border: 'none',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif',
                cursor: selectedType ? 'pointer' : 'not-allowed',
                background: selectedType ? 'linear-gradient(135deg, #fd8b00, #8c4a00)' : 'rgba(255,255,255,0.08)',
                color: selectedType ? 'white' : '#555', transition: 'all 0.15s',
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
          <div className="flex items-center justify-between mb-3 mt-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} style={{ color: '#888', fontSize: 16 }}>←</button>
              <span className="text-white font-bold text-base">
                {selectedTypeMeta?.icon} {selectedTypeMeta?.label}
              </span>
            </div>
          </div>

          {/* Location badge */}
          <div className="flex items-center gap-1.5 mb-3">
            <span style={{ fontSize: 12 }}>📍</span>
            {lockedPlace ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fd8b00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lockedPlace.name}
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fd8b00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current map view
              </span>
            )}
          </div>

          {outOfBounds && (
            <div style={{
              marginBottom: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(220,30,30,0.15)',
              border: '1px solid rgba(220,30,30,0.3)',
              fontSize: 12,
              color: '#fca5a5',
              fontWeight: 600,
            }}>
              ⚠️ This location is outside your campus zone. You can't post here.
            </div>
          )}

          <div className="flex flex-col gap-3 mb-4">
            <div>
              <input
                style={inputStyle}
                type="text"
                placeholder="Give it a title..."
                maxLength={100}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {title.length > 80 && (
                <p style={{ fontSize: 10, color: title.length >= 100 ? '#f87171' : '#888', textAlign: 'right', margin: '2px 0 0' }}>
                  {title.length}/100
                </p>
              )}
            </div>
            <div>
              <textarea
                style={{ ...inputStyle, resize: 'none', minHeight: 72 }}
                placeholder="What's happening..."
                maxLength={500}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {description.length > 400 && (
                <p style={{ fontSize: 10, color: description.length >= 500 ? '#f87171' : '#888', textAlign: 'right', margin: '2px 0 0' }}>
                  {description.length}/500
                </p>
              )}
            </div>
            {(selectedType === 'event' || selectedType === 'volunteer') && (
              <div className="flex gap-2">
                <input style={{ ...inputStyle, flex: 1 }} type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                <input style={{ ...inputStyle, flex: 1 }} type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
              </div>
            )}
            {selectedType === 'volunteer' && (
              <input
                style={inputStyle} type="number" placeholder="Volunteer hours (e.g. 2)"
                min={1} value={hours} onChange={e => setHours(e.target.value)}
              />
            )}
            {selectedType === 'deal' && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🪙</span>
                <input
                  style={{ ...inputStyle, paddingLeft: 36 }} type="number"
                  placeholder="Buzz Points to redeem" min={1}
                  value={buzzCost} onChange={e => setBuzzCost(e.target.value)}
                />
              </div>
            )}
          </div>

          {postError && (
            <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8, textAlign: 'center' }}>{postError}</p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <button onClick={() => setStep(1)} disabled={isPosting} style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || isPosting || outOfBounds}
              style={{
                padding: '8px 20px', borderRadius: 999, border: 'none',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif',
                cursor: title.trim() && !isPosting && !outOfBounds ? 'pointer' : 'not-allowed',
                background: title.trim() && !isPosting && !outOfBounds ? 'linear-gradient(135deg, #fd8b00, #8c4a00)' : 'rgba(255,255,255,0.08)',
                color: title.trim() && !isPosting && !outOfBounds ? 'white' : '#555', transition: 'all 0.15s',
              }}
            >
              {isPosting ? 'Posting...' : 'Post to Map 🚀'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Admin Edit Pin Form ──────────────────────────────────────────────────────

function EditPinForm({ pinId, initial, onDone }: {
  pinId: string
  initial: { title: string; description: string; event_date: string | null; buzz_reward: number; volunteer_hours: number | null; type: string }
  onDone: () => void
}) {
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [eventDate, setEventDate] = useState(initial.event_date ? initial.event_date.slice(0, 10) : '')
  const [eventTime, setEventTime] = useState(initial.event_date ? initial.event_date.slice(11, 16) : '')
  const [buzzReward, setBuzzReward] = useState(String(initial.buzz_reward))
  const [hours, setHours] = useState(initial.volunteer_hours != null ? String(initial.volunteer_hours) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmedTitle = title.trim().slice(0, 100)
    if (!trimmedTitle) { setError('Title is required'); return }
    const buzzNum = Number(buzzReward)
    if (isNaN(buzzNum) || buzzNum < 0 || buzzNum > 1000) { setError('Buzz reward must be 0–1000'); return }
    const event_date = eventDate
      ? (eventTime ? `${eventDate}T${eventTime}` : eventDate)
      : null
    const hoursNum = hours ? Number(hours) : null
    setSaving(true)
    setError(null)
    try {
      await updatePin(pinId, {
        title: trimmedTitle,
        description: description.trim().slice(0, 500),
        event_date,
        buzz_reward: buzzNum,
        volunteer_hours: initial.type === 'volunteer' ? hoursNum : null,
      })
      onDone()
    } catch (e) {
      console.error(e)
      setError('Save failed. Check console.')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#fd8b00' }}>✏️ Edit Pin</p>
      <input
        style={inputStyle} type="text" placeholder="Title" maxLength={100}
        value={title} onChange={e => setTitle(e.target.value)}
      />
      <textarea
        style={{ ...inputStyle, resize: 'none', minHeight: 80 }}
        placeholder="Description" maxLength={500}
        value={description} onChange={e => setDescription(e.target.value)}
      />
      {(initial.type === 'event' || initial.type === 'volunteer') && (
        <div className="flex gap-2">
          <input style={{ ...inputStyle, flex: 1 }} type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
        </div>
      )}
      {initial.type === 'volunteer' && (
        <input style={inputStyle} type="number" placeholder="Volunteer hours (1–12)"
          min={1} max={12} value={hours} onChange={e => setHours(e.target.value)} />
      )}
      <input style={inputStyle} type="number" placeholder="Buzz reward"
        min={0} max={1000} value={buzzReward} onChange={e => setBuzzReward(e.target.value)} />
      {error && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</p>}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onDone} disabled={saving}
          style={{
            flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
            color: '#aaa', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave} disabled={saving || !title.trim()}
          style={{
            flex: 2, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #fd8b00, #8c4a00)',
            color: saving ? '#555' : 'white',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Main DetailPanel ─────────────────────────────────────────────────────────

export default function DetailPanel() {
  const { selectedPin, selectedPlace, livePins, createPinContext, pinPlacementMode, hoveredPlace,
          setSelectedPin, setSelectedPlace, setCreatePinContext, setPinPlacementMode } = useMapStore()

  const user = useAuthStore(state => state.user)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    getAdminInfo(user.uid).then(info => setIsAdmin(info !== null)).catch(() => setIsAdmin(false))
  }, [user?.uid])

  // Reset edit/delete state when selected pin changes
  useEffect(() => { setEditing(false); setConfirmDelete(false) }, [selectedPin?.id])

  // Username cache: uid → display name
  const usernameCache = useRef<Record<string, string>>({})
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedPin) { setDisplayName(null); return }
    const uid = selectedPin.username // currently stores uid
    if (usernameCache.current[uid]) {
      setDisplayName(usernameCache.current[uid])
      return
    }
    getDoc(doc(db, 'users', uid)).then(snap => {
      const name = snap.data()?.username ?? uid
      usernameCache.current[uid] = name
      setDisplayName(name)
    }).catch(() => setDisplayName(uid))
  }, [selectedPin?.username])

  const pinsHere = selectedPlace
    ? livePins.filter(p => distanceM(p.lat, p.lng, selectedPlace.lat, selectedPlace.lng) <= 80)
    : []

  const isOpen = selectedPin !== null || selectedPlace !== null || createPinContext !== null || pinPlacementMode

  const close = () => {
    setSelectedPin(null)
    setSelectedPlace(null)
    setCreatePinContext(null)
    setPinPlacementMode(false)
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

      {/* PLACEMENT MODE — no building hovered yet */}
      {pinPlacementMode && !hoveredPlace && (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
          <span style={{ fontSize: 52 }}>📍</span>
          <p className="text-white font-bold text-base text-center">Hover over a building to place your pin</p>
          <p className="text-sm text-center" style={{ color: '#888' }}>Move your cursor over any POI on the map</p>
          <button
            onClick={() => setPinPlacementMode(false)}
            style={{
              marginTop: 16, padding: '10px 28px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)',
              color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* PLACEMENT MODE — building previewed */}
      {pinPlacementMode && hoveredPlace && (
        <div className="flex flex-col h-full p-6">
          <div className="mt-2 mb-2">
            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white" style={{ background: '#8B5CF6' }}>
              {hoveredPlace.category}
            </span>
          </div>
          <h2 className="text-white font-extrabold text-xl mt-3 mb-1">{hoveredPlace.name}</h2>
          <p className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#fd8b00' }}>
            📍 {hoveredPlace.lat.toFixed(4)}, {hoveredPlace.lng.toFixed(4)}
          </p>

          <div className="mt-auto flex flex-col gap-3">
            <button
              onClick={() => {
                setPinPlacementMode(false)
                setCreatePinContext({ lockedPlace: hoveredPlace })
              }}
              className="w-full py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #fd8b00, #8c4a00)', cursor: 'pointer' }}
            >
              📍 Click to pin here
            </button>
            <button
              onClick={() => setPinPlacementMode(false)}
              style={{
                padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: '#aaa',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CREATE PIN FORM */}
      {createPinContext !== null && <CreatePinForm />}

      {/* PIN DETAIL */}
      {selectedPin && (
        <div className="flex flex-col h-full p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 mt-2">
            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white"
              style={{ background: PIN_COLORS[selectedPin.type] }}>
              {PIN_LABELS[selectedPin.type]}
            </span>
            {isAdmin && !editing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                    border: '1px solid rgba(253,139,0,0.4)', background: 'rgba(253,139,0,0.1)',
                    color: '#fd8b00', cursor: 'pointer',
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                    border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
                    color: '#f87171', cursor: 'pointer',
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            )}
          </div>

          {confirmDelete && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-sm font-bold text-white mb-3">Delete this pin permanently?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                    color: '#aaa', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true)
                    try {
                      await deletePin(selectedPin.id)
                      close()
                    } catch (e) {
                      console.error(e)
                      setDeleting(false)
                      setConfirmDelete(false)
                    }
                  }}
                  style={{
                    flex: 2, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: deleting ? 'not-allowed' : 'pointer',
                    background: deleting ? 'rgba(255,255,255,0.08)' : '#dc2626',
                    color: 'white',
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
          <h2 className="text-white font-extrabold text-xl mb-2">{selectedPin.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full" style={{ background: selectedPin.userColor }} />
            <span className="text-sm font-semibold" style={{ color: '#aaa' }}>
              @{displayName ?? selectedPin.username} · {timeAgo(selectedPin.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#ccc' }}>{selectedPin.description}</p>
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: '#0f0f1a' }}>
            <span className="text-xl">🪙</span>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#888' }}>Buzz Reward</p>
              <p className="font-extrabold text-lg" style={{ color: '#fd8b00' }}>{selectedPin.buzzReward} Buzz Points</p>
            </div>
          </div>
          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <p className="text-sm mb-6" style={{ color: '#aaa' }}>
            👥 {selectedPin.participantCount} {selectedPin.participantCount === 1 ? 'person' : 'people'} joined
          </p>

          {editing ? (
            <EditPinForm
              pinId={selectedPin.id}
              initial={{
                title: selectedPin.title,
                description: selectedPin.description,
                event_date: selectedPin.eventDate,
                buzz_reward: selectedPin.buzzReward,
                volunteer_hours: selectedPin.volunteerHours ?? null,
                type: selectedPin.type,
              }}
              onDone={() => setEditing(false)}
            />
          ) : (
            <div className="mt-auto">
              <button className="w-full py-3.5 rounded-xl font-bold text-white text-base"
                style={{ background: 'linear-gradient(135deg, #fd8b00, #8c4a00)' }}>
                {selectedPin.type === 'help' ? 'Accept & Help' : 'Join'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PLACE CONTENT */}
      {selectedPlace && (
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mt-2 mb-2">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white" style={{ background: '#8B5CF6' }}>
                {selectedPlace.category}
              </span>
            </div>
            <h2 className="text-white font-extrabold text-xl mt-3 mb-1">{selectedPlace.name}</h2>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fd8b00' }}>● ACTIVE HUB</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {/* Live pins at this building */}
            {pinsHere.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#888' }}>
                  Active at this location
                </p>
                {pinsHere.map(pin => (
                  <div key={pin.id} className="rounded-xl p-4 mb-3"
                    style={{ background: '#0f0f1a', borderLeft: `3px solid ${PIN_COLORS[pin.type] ?? '#fd8b00'}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: `${PIN_COLORS[pin.type]}22`, color: PIN_COLORS[pin.type] }}>
                        {pin.type}
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#fd8b00' }}>🪙 {pin.buzzReward}</span>
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{pin.title}</p>
                    <p className="text-xs mb-3" style={{ color: '#888' }}>👥 {pin.participantCount} joined</p>
                    <button
                      onClick={() => setSelectedPin(pin)}
                      className="w-full py-2 rounded-lg font-bold text-white text-sm"
                      style={{ background: `linear-gradient(135deg, ${PIN_COLORS[pin.type]}, ${PIN_COLORS[pin.type]}99)` }}
                    >
                      Join →
                    </button>
                  </div>
                ))}
                <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}

            {/* TODO: Replace with GET /places/{id}/posts */}
            {selectedPlace.posts.length === 0 && pinsHere.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full mt-8 gap-3">
                <span style={{ fontSize: 48 }}>📭</span>
                <p className="font-bold text-white text-base">No buzz here yet</p>
                <p className="text-sm text-center" style={{ color: '#888' }}>Be the first to post something!</p>
              </div>
            ) : (
              selectedPlace.posts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </div>

          {/* POST HERE */}
          <div className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(to top, #1a1a2e 80%, transparent)' }}>
            <button
              onClick={() => setCreatePinContext({ lockedPlace: { name: selectedPlace.name, lat: selectedPlace.lat, lng: selectedPlace.lng } })}
              className="w-full py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #fd8b00, #8c4a00)' }}
            >
              + POST HERE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
