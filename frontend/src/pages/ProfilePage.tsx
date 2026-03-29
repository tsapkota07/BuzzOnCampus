import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { getTheme } from '../utils/themes'

const UNIVERSITY_NAMES: Record<string, string> = {
  ysu: 'Youngstown State University',
  kent: 'Kent State University',
  osu: 'Ohio State University',
  other: 'General / Testing',
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const universityId = user?.university_id ?? 'other'
  const { primary, secondary, bg, inputBg, text, subtext, buttonGradient } = getTheme(universityId)
  const cardBorder = `${primary}33`
  const userInitial = (user as any)?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'
  const displayName = (user as any)?.username ?? user?.email?.split('@')[0] ?? 'User'

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
            { label: 'Pins Posted', value: 0, hi: false },
            { label: 'Vol. Hours', value: 0, hi: false },
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
