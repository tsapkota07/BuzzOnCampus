import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from './firebase'

// ─── Pin shape as stored in Firestore ────────────────────────────────────────
// avatar_model: path to the .glb model file in /public/models/
//   e.g. '/models/red.glb', '/models/blue.glb', '/models/robot.glb'
//   Defaults to '/models/red.glb' if user has no avatar_url set.
//   This is what makes different users show different 3D pins on the map.
export interface FirestorePin {
  id: string
  user_id: string
  username: string            // display name — cached at pin creation time
  user_color: string
  avatar_model: string        // glb file path — drives which 3D model renders on map
  type: 'event' | 'volunteer' | 'help'
  title: string
  description: string
  buzz_reward: number
  volunteer_hours: number | null  // volunteer pins only
  lat: number
  lng: number
  status: 'active' | 'completed' | 'cancelled'
  university_id: string
  event_date: string | null
  participant_count: number
  created_at: string
}

// ─── Input for creating a new pin ────────────────────────────────────────────
export interface CreatePinInput {
  user_id: string
  username: string            // pass (user as any).username ?? user.email
  user_color: string
  avatar_model: string        // pass user.avatar_url ?? '/models/red.glb'
  type: 'event' | 'volunteer' | 'help'
  title: string
  description: string
  buzz_reward: number
  volunteer_hours: number | null  // volunteer pins only; null for all other types
  lat: number
  lng: number
  university_id: string
  event_date: string | null
}

// ─── Write a new pin to Firestore ────────────────────────────────────────────
export async function createPin(input: CreatePinInput): Promise<string> {
  // Phase 11 — HIGH: auth guard before any Firestore write
  if (!getAuth().currentUser) throw new Error('Not authenticated')

  const ref = await addDoc(collection(db, 'pins'), {
    ...input,
    status: 'active',
    participant_count: 0,
    created_at: serverTimestamp(),
  })
  return ref.id
}

// ─── Update a pin (admin only) ───────────────────────────────────────────────
export type PinUpdateFields = Partial<Pick<FirestorePin,
  'title' | 'description' | 'event_date' | 'buzz_reward' | 'volunteer_hours' | 'status'
>>

export async function updatePin(pinId: string, updates: PinUpdateFields): Promise<void> {
  if (!getAuth().currentUser) throw new Error('Not authenticated')
  await updateDoc(doc(db, 'pins', pinId), updates as Record<string, unknown>)
}

// ─── Delete a pin (admin only) ───────────────────────────────────────────────
export async function deletePin(pinId: string): Promise<void> {
  if (!getAuth().currentUser) throw new Error('Not authenticated')
  await deleteDoc(doc(db, 'pins', pinId))
}

// ─── Subscribe to live pins for a university ─────────────────────────────────
// Returns unsubscribe function — call it in useEffect cleanup.
// callback receives the latest array of FirestorePin every time Firestore updates.
export function subscribeToPins(
  university_id: string,
  callback: (pins: FirestorePin[]) => void
): () => void {
  const q = query(
    collection(db, 'pins'),
    where('university_id', '==', university_id),
    where('status', '==', 'active')
  )

  // TODO: Add onSnapshot index if Firestore warns about missing composite index
  const unsubscribe = onSnapshot(q, snapshot => {
    const pins: FirestorePin[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<FirestorePin, 'id'>),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }))
    callback(pins)
  })

  return unsubscribe
}
