import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { getTheme } from '../utils/themes'
import { getAdminInfo, getPendingHoursRequests, callApproveVolunteerHours } from '../api/admin'
import type { AdminInfo, PendingHoursRequest } from '../api/admin'

const UNIVERSITY_LABELS: Record<string, string> = {
  ysu:     'Youngstown State University',
  kent:    'Kent State University',
  osu:     'Ohio State University',
  general: 'All Universities',
}

const UNIVERSITY_COLORS: Record<string, string> = {
  ysu:     '#CC0000',
  kent:    '#002664',
  osu:     '#BB0000',
  general: '#7C3AED',
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const universityId = user?.university_id ?? 'other'
  const theme = getTheme(universityId)
  const { primary, bg, inputBg, text, subtext } = theme
  const cardBorder = `${primary}33`

  const [adminInfo, setAdminInfo] = useState<AdminInfo | null | undefined>(undefined) // undefined = loading
  const [requests, setRequests] = useState<PendingHoursRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return
    getAdminInfo(user.uid).then(info => {
      setAdminInfo(info)
      if (info) {
        getPendingHoursRequests(info.university_id)
          .then(setRequests)
          .catch(console.error)
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [user?.uid])

  const handleAction = async (participationId: string, action: 'approve' | 'reject') => {
    setActing(participationId)
    try {
      await callApproveVolunteerHours(participationId, action)
      setRequests(prev => prev.filter(r => r.id !== participationId))
    } catch (err) {
      console.error('Action failed:', err)
      alert('Action failed. Check console for details.')
    } finally {
      setActing(null)
    }
  }

  const scopeColor = adminInfo ? (UNIVERSITY_COLORS[adminInfo.university_id] ?? primary) : primary
  const scopeLabel = adminInfo ? (UNIVERSITY_LABELS[adminInfo.university_id] ?? adminInfo.university_id) : ''
  const isSuperAdmin = adminInfo?.university_id === 'general'

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Inter, system-ui, sans-serif', color: text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: `${primary}18`, borderBottom: `1px solid ${cardBorder}` }}>
        <button
          onClick={() => navigate('/map')}
          style={{ background: `${primary}18`, border: `1px solid ${primary}44`, borderRadius: 10, color: primary, padding: '5px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Back to Map
        </button>
        <span style={{ color: subtext, fontSize: 13, fontWeight: 600 }}>Admin Panel</span>
        {adminInfo && (
          <span style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 999,
            background: `${scopeColor}22`, color: scopeColor,
            border: `1px solid ${scopeColor}44`,
          }}>
            {isSuperAdmin ? '⭐ Super Admin' : `🛡️ ${adminInfo.university_id.toUpperCase()} Admin`}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Loading check */}
        {adminInfo === undefined && (
          <p style={{ color: subtext, textAlign: 'center', marginTop: 40 }}>Checking permissions…</p>
        )}

        {/* Access denied */}
        {adminInfo === null && (
          <div style={{ background: inputBg, borderRadius: 14, border: '1px solid #ef444422', padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, margin: '0 0 12px' }}>🚫</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', margin: '0 0 6px' }}>Access Denied</p>
            <p style={{ fontSize: 13, color: subtext, margin: 0 }}>Your account is not registered as an admin.</p>
          </div>
        )}

        {/* Admin content */}
        {adminInfo !== null && adminInfo !== undefined && (
          <>
            {/* Scope card */}
            <div style={{ background: inputBg, borderRadius: 14, border: `1px solid ${cardBorder}`, borderLeft: `3px solid ${scopeColor}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${scopeColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {isSuperAdmin ? '⭐' : '🛡️'}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0 }}>{scopeLabel}</p>
                <p style={{ fontSize: 11, color: subtext, margin: '2px 0 0' }}>
                  {isSuperAdmin
                    ? 'You can approve volunteer hours for all universities.'
                    : `You can only approve hours for ${scopeLabel} participants.`}
                </p>
              </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Pending Volunteer Hours</p>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: requests.length > 0 ? '#F59E0B22' : `${primary}22`, color: requests.length > 0 ? '#F59E0B' : primary }}>
                {loading ? '…' : `${requests.length} pending`}
              </span>
            </div>

            {loading && (
              <p style={{ color: subtext, textAlign: 'center', padding: '20px 0' }}>Loading requests…</p>
            )}

            {!loading && requests.length === 0 && (
              <div style={{ background: inputBg, borderRadius: 14, border: `1px solid ${cardBorder}`, padding: '36px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 36, margin: '0 0 10px' }}>✅</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: subtext, margin: 0 }}>No pending requests</p>
              </div>
            )}

            {requests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                inputBg={inputBg}
                cardBorder={cardBorder}
                text={text}
                subtext={subtext}
                isSuperAdmin={isSuperAdmin}
                acting={acting}
                onAction={handleAction}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function RequestCard({ req, inputBg, cardBorder, text, subtext, isSuperAdmin, acting, onAction }: {
  req: PendingHoursRequest
  inputBg: string
  cardBorder: string
  text: string
  subtext: string
  isSuperAdmin: boolean
  acting: string | null
  onAction: (id: string, action: 'approve' | 'reject') => void
}) {
  const isActing = acting === req.id
  const uniId = req.pin?.university_id ?? ''
  const uniColor = UNIVERSITY_COLORS[uniId] ?? '#888'

  return (
    <div style={{ background: inputBg, borderRadius: 14, border: `1px solid ${cardBorder}`, borderLeft: '3px solid #22C55E', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {req.pin?.title ?? 'Unknown pin'}
          </p>
          <p style={{ fontSize: 11, color: subtext, margin: '3px 0 0' }}>
            @{req.username}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#22C55E' }}>{req.volunteer_hours}h</span>
          {isSuperAdmin && uniId && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: `${uniColor}22`, color: uniColor }}>
              {uniId.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {req.pin?.description && (
        <p style={{ fontSize: 12, color: subtext, margin: '4px 0 10px', lineHeight: 1.4 }}>{req.pin.description}</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onAction(req.id, 'approve')}
          disabled={isActing}
          style={{
            flex: 1, padding: '8px', borderRadius: 10, border: 'none',
            background: isActing ? '#22C55E44' : '#22C55E',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: isActing ? 'not-allowed' : 'pointer',
          }}
        >
          {isActing ? '…' : '✓ Approve'}
        </button>
        <button
          onClick={() => onAction(req.id, 'reject')}
          disabled={isActing}
          style={{
            flex: 1, padding: '8px', borderRadius: 10,
            border: '1px solid #ef444444', background: 'transparent',
            color: '#ef4444', fontSize: 13, fontWeight: 700,
            cursor: isActing ? 'not-allowed' : 'pointer',
          }}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  )
}
