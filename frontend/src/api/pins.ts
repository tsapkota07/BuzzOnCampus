import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Pin shape as stored in Firestore ────────────────────────────────────────
// avatar_model: path to the .glb model file in /public/models/
//   e.g. '/models/red.glb', '/models/blue.glb', '/models/robot.glb'
//   Defaults to '/models/red.glb' if user has no avatar_url set.
//   This is what makes different users show different 3D pins on the map.
export interface FirestorePin {
  id: string
  user_id: string
  user_color: string
  avatar_model: string        // glb file path — drives which 3D model renders on map
  type: 'event' | 'volunteer' | 'help'
  title: string
  description: string
  buzz_reward: number
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
  user_color: string
  avatar_model: string        // pass user.avatar_url ?? '/models/red.glb'
  type: 'event' | 'volunteer' | 'help'
  title: string
  description: string
  buzz_reward: number
  lat: number
  lng: number
  university_id: string
  event_date: string | null
}

// ─── Write a new pin to Firestore ────────────────────────────────────────────
export async function createPin(input: CreatePinInput): Promise<string> {
  const ref = await addDoc(collection(db, 'pins'), {
    ...input,
    status: 'active',
    participant_count: 0,
    created_at: serverTimestamp(),
  })
  return ref.id
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
