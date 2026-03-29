import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import type { FirestorePin } from './pins'

export interface AdminInfo {
  university_id: string    // 'general' = super-admin; anything else = scoped
  email: string
  is_dev: boolean
}

export interface PendingHoursRequest {
  id: string
  pin_id: string
  user_id: string
  username: string
  status: 'joined' | 'completed'
  joined_at: string
  volunteer_hours: number
  hours_status: 'pending'
  pin?: FirestorePin
}

/** Returns the admin doc if the uid is in the admins collection, or null. */
export async function getAdminInfo(uid: string): Promise<AdminInfo | null> {
  const snap = await getDoc(doc(db, 'admins', uid))
  if (!snap.exists()) return null
  return snap.data() as AdminInfo
}

/** @deprecated Use getAdminInfo instead */
export async function isAdmin(uid: string): Promise<boolean> {
  return (await getAdminInfo(uid)) !== null
}

/**
 * Returns pending volunteer hour requests visible to this admin.
 * - 'general' admins see all universities.
 * - Scoped admins see only their own university's pins.
 */
export async function getPendingHoursRequests(
  adminUniversityId: string
): Promise<PendingHoursRequest[]> {
  const isSuperAdmin = adminUniversityId === 'general'

  const q = query(
    collection(db, 'participations'),
    where('hours_status', '==', 'pending')
  )
  const snap = await getDocs(q)
  const participations = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    joined_at: d.data().joined_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  })) as PendingHoursRequest[]

  const withPins = await Promise.all(
    participations.map(async (p) => {
      try {
        const pinSnap = await getDoc(doc(db, 'pins', p.pin_id))
        if (!pinSnap.exists()) return null
        const pin = { id: pinSnap.id, ...pinSnap.data() } as FirestorePin

        // Scope filter: scoped admins only see their university
        if (!isSuperAdmin && pin.university_id !== adminUniversityId) return null

        const userSnap = await getDoc(doc(db, 'users', p.user_id))
        const username = userSnap.data()?.username ?? p.user_id

        return { ...p, pin, username }
      } catch {
        return null
      }
    })
  )

  return withPins.filter(Boolean) as PendingHoursRequest[]
}

const approveVolunteerHoursCallable = httpsCallable(functions, 'approveVolunteerHours')

export async function callApproveVolunteerHours(
  participationId: string,
  action: 'approve' | 'reject'
): Promise<void> {
  await approveVolunteerHoursCallable({ participationId, action })
}
