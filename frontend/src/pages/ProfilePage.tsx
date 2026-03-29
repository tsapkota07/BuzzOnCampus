import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { getTheme } from '../utils/themes'
import { getUserPins } from '../api/participations'
import type { FirestorePin } from '../api/pins'

const UNIVERSITY_NAMES: Record<string, string> = {
  ysu: 'Youngstown State University',
  kent: 'Kent State University',
  osu: 'Ohio State University',
  other: 'General / Testing',
}

const PIN_COLORS: Record<string, string> = {
  event: '#3B82F6',
  volunteer: '#22C55E',
  help: '#F59E0B',
  business: '#A855F7',
}

const PIN_ICONS: Record<string, string> = {
  event: '📅',
  volunteer: '🤝',
  help: '🆘',
  business: '🏷️',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const universityId = user?.university_id ?? 'other'
  const { primary, secondary, bg, inputBg, text, subtext, buttonGradient } = getTheme(universityId)
  const cardBorder = `${primary}33`
  const userInitial = (user as any)?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'
  const displayName = (user as any)?.username ?? user?.email?.split('@')[0] ?? 'User'
  const volHoursTotal = (user as any)?.volunteer_hours_total ?? 0

  const [userPins, setUserPins] = useState<FirestorePin[]>([])
  const [loadingPins, setLoadingPins] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    getUserPins(user.uid)
      .then(setUserPins)
      .catch(console.error)
      .finally(() => setLoadingPins(false))
  }, [user?.uid])

  const now = new Date()
  const upcomingPins = userPins.filter(p =>
    p.status === 'active' && (!p.event_date || new Date(p.event_date) >= now)
  ).sort((a, b) => {
    if (a.event_date && b.event_date) return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const pastPins = userPins.filter(p =>
    p.status === 'completed' || p.status === 'cancelled' || (p.event_date && new Date(p.event_date) < now)
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Inter, system-ui, sans-serif', color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: `${primary}18`, borderBottom: `1px solid ${cardBorder}` }}>
        <button onClick={() => navigate('/map')} style={{ background: `${primary}18`, border: `1px solid ${primary}44`, borderRadius: 10, color: primary, padding: '5px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ← Back to Map
        </button>
        <span style={{ color: subtext, fontSize: 13, fontWeight: 600 }}>Profile</span>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Banner + avatar */}
        <div style={{ borderRadius: 18, border: `1px solid ${cardBorder}`, boxShadow: `0 4px 20px ${primary}15` }}>
          <div style={{ height: 90, background: buttonGradient, borderRadius: '18px 18px 0 0' }} />
          <div style={{ background: inputBg, padding: '0 20px 18px', borderRadius: '0 0 18px 18px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: user?.color ?? primary, border: `3px solid ${inputBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white', marginTop: -32, marginBottom: 10, boxShadow: `0 4px 16px ${primary}55`, position: 'relative', zIndex: 1 }}>
              {userInitial}
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 2px', color: text }}>{displayName}</h1>
            <p style={{ color: subtext, fontSize: 12, margin: '0 0 8px' }}>{user?.email}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${primary}22`, color: primary, border: `1px solid ${primary}55`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {UNIVERSITY_NAMES[universityId] ?? 'University'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Buzz Points', value: user?.buzz_balance ?? 0, hi: true },
            { label: 'Pins Posted', value: loadingPins ? '…' : userPins.length, hi: false },
            { label: 'Vol. Hours', value: volHoursTotal, hi: false },
          ].map((s, i) => (
            <div key={i} style={{ background: inputBg, borderRadius: 14, padding: '12px 8px', textAlign: 'center', border: `1px solid ${cardBorder}` }}>
              <p style={{ fontSize: 24, fontWeight: 900, margin: 0, color: s.hi ? primary : text }}>{s.value}</p>
              <p style={{ fontSize: 10, color: subtext, margin: '3px 0 0', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Avatar color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: inputBg, borderRadius: 14, padding: '12px 16px', border: `1px solid ${cardBorder}` }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: user?.color ?? primary, border: `2px solid ${primary}55`, flexShrink: 0 }} />
          <div>
            <p style={{ color: subtext, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Avatar Color</p>
            <p style={{ color: text, fontSize: 13, fontWeight: 600, margin: '2px 0 0' }}>{user?.color ?? primary}</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: subtext, margin: '0 0 10px' }}>
            Upcoming Pins
          </p>
          {loadingPins ? (
            <p style={{ fontSize: 13, color: subtext, textAlign: 'center', padding: '16px 0' }}>Loading…</p>
          ) : upcomingPins.length === 0 ? (
            <div style={{ background: inputBg, borderRadius: 14, border: `1px solid ${cardBorder}`, padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ color: subtext, fontSize: 13, margin: 0 }}>No upcoming pins posted yet</p>
            </div>
          ) : (
            upcomingPins.map(pin => (
              <PinCard key={pin.id} pin={pin} inputBg={inputBg} cardBorder={cardBorder} text={text} subtext={subtext} />
            ))
          )}
        </div>

        {/* Past Events */}
        {pastPins.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: subtext, margin: '0 0 10px' }}>
              Past Pins
            </p>
            {pastPins.map(pin => (
              <PinCard key={pin.id} pin={pin} inputBg={inputBg} cardBorder={cardBorder} text={text} subtext={subtext} dim />
            ))}
          </div>
        )}

        {/* Actions */}
        {[{ icon: '🔔', label: 'Notifications' }, { icon: '🎨', label: 'Edit Profile' }].map(item => (
          <button key={item.label} style={{ width: '100%', padding: '11px 16px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: inputBg, color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
            <span style={{ marginLeft: 'auto', color: secondary }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PinCard({ pin, inputBg, cardBorder, text, subtext, dim }: {
  pin: FirestorePin
  inputBg: string
  cardBorder: string
  text: string
  subtext: string
  dim?: boolean
}) {
  const color = PIN_COLORS[pin.type] ?? '#888'
  const icon = PIN_ICONS[pin.type] ?? '📌'
  return (
    <div style={{
      background: inputBg,
      borderRadius: 14,
      border: `1px solid ${cardBorder}`,
      borderLeft: `3px solid ${color}`,
      padding: '12px 14px',
      marginBottom: 8,
      opacity: dim ? 0.65 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}22`, padding: '1px 7px', borderRadius: 999 }}>
          {icon} {pin.type.toUpperCase()}
        </span>
        {pin.status === 'completed' && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', background: '#22C55E22', padding: '1px 7px', borderRadius: 999 }}>DONE</span>
        )}
        {pin.volunteer_hours && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', marginLeft: 'auto' }}>{pin.volunteer_hours}h</span>
        )}
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: '0 0 2px' }}>{pin.title}</p>
      {pin.event_date && (
        <p style={{ fontSize: 11, color: subtext, margin: 0 }}>{formatDate(pin.event_date)}</p>
      )}
      <p style={{ fontSize: 11, color: subtext, margin: '2px 0 0' }}>
        👥 {pin.participant_count} joined · 🪙 {pin.buzz_reward} buzz
      </p>
    </div>
  )
}
