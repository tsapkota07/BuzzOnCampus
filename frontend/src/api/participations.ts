import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import type { FirestorePin } from './pins'

export interface Participation {
  id: string
  pin_id: string
  user_id: string
  status: 'joined' | 'completed'
  joined_at: string
  volunteer_hours: number | null
  hours_status: 'pending' | 'approved' | 'disputed' | 'rejected' | null
}

export async function getUserPins(uid: string): Promise<FirestorePin[]> {
  const q = query(collection(db, 'pins'), where('user_id', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<FirestorePin, 'id'>),
    created_at: d.data().created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }))
}

export async function getUserParticipations(uid: string): Promise<Participation[]> {
  const q = query(collection(db, 'participations'), where('user_id', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<Participation, 'id'>),
    joined_at: d.data().joined_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }))
}
