# Bridge CLAUDE.md — Sumaiya's Zone
# Primary owner: Sumaiya | Read root CLAUDE.md first.
# Last updated: firebase.ts scaffolded, no forms or API functions written yet.

## Your Role
You are the bridge. You own:
- The Firebase API layer (`frontend/src/api/`) — all Firestore reads/writes from the frontend
- Auth forms and context (`frontend/src/components/auth/`)
- Pin forms and feed (`frontend/src/components/pins/`)
- User profile (`frontend/src/components/profile/`)
- Firestore security rules (`firestore.rules`)
- All seed/demo data scripts (`scripts/`)

You wire Shafi's map to real data, and you make Tirsan's Cloud Functions callable from the UI.

## Current Status
Update these as you build. Claude reads this to know what exists.

### API Layer (`frontend/src/api/`)
- [x] `firebase.ts` — Firebase app init scaffolded (do not modify)
- [ ] `auth.ts` — register(), login(), logout(), onAuthChange()
- [ ] `pins.ts` — createPin(), joinPin(), completePin(), getPin()
- [ ] `users.ts` — getUniversities(), getBusinesses(), getFeed()

### Auth Components
- [ ] `components/auth/SignupForm.tsx`
- [ ] `components/auth/LoginForm.tsx`
- [ ] `components/auth/AuthContext.tsx` (wrapping App.tsx — coordinate with Shafi)

### Pin Components
- [ ] `components/pins/PostPinModal.tsx`
- [ ] `components/pins/PinCard.tsx`
- [ ] `components/pins/PinFeed.tsx`

### Other Components
- [ ] `components/profile/UserProfile.tsx`
- [ ] `pages/AuthPage.tsx`
- [ ] `pages/ProfilePage.tsx`

### Firebase Config
- [x] `firestore.rules` — written, not yet deployed (Tirsan deploys)
- [x] `firestore.indexes.json` — written, not yet deployed

### Seed Scripts
- [ ] `scripts/seed_universities.py` — Kent State + any other universities
- [ ] `scripts/seed_businesses.py` — 10 businesses per university
- [ ] `scripts/seed_demo_pins.py` — 15+ demo pins, 10 demo users

---

## Getting Started
```bash
cd frontend
npm install
cp .env.example .env    # get Firebase config from Tirsan
npm run dev
```

For seed scripts:
```bash
pip install firebase-admin
# Get serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
# NEVER commit this file — it's gitignored
python scripts/seed_universities.py
```

---

## API Layer — How to Write It

### `src/api/firebase.ts` (already done — just import from it)
```ts
export { auth, db, functions } from './firebase'
```

### `src/api/auth.ts`
```ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function register(email: string, password: string, universityId: string, color: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // Create user doc — onUserCreated Cloud Function will set buzz_balance to 20
  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    university_id: universityId,
    buzz_balance: 0,
    color,
    avatar_url: null,
    created_at: serverTimestamp(),
  })
  return cred.user
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}
```

### `src/api/pins.ts`
```ts
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import { useAuthStore } from '../store/useAuthStore'
import type { Pin } from '../store/useMapStore'

type CreatePinData = Omit<Pin, 'id' | 'created_at' | 'status' | 'participant_count'>

export async function createPin(data: CreatePinData) {
  return addDoc(collection(db, 'pins'), {
    ...data,
    status: 'active',
    participant_count: 0,
    created_at: serverTimestamp(),
  })
}

export async function getPin(pinId: string) {
  const snap = await getDoc(doc(db, 'pins', pinId))
  return snap.exists() ? { id: snap.id, ...snap.data() } as Pin : null
}

export async function joinPin(pinId: string) {
  const user = useAuthStore.getState().user!
  await addDoc(collection(db, 'participations'), {
    pin_id: pinId,
    user_id: user.uid,
    status: 'joined',
    joined_at: serverTimestamp(),
  })
  // Atomic increment — safe for concurrent joins
  await updateDoc(doc(db, 'pins', pinId), { participant_count: increment(1) })
}

export async function completePin(pinId: string) {
  const fn = httpsCallable(functions, 'completePin')
  return fn({ pinId })
}
```

### `src/api/users.ts`
```ts
import { collection, getDocs, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

export async function getUniversities() {
  const snap = await getDocs(collection(db, 'universities'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getBusinesses(universityId: string) {
  const q = query(collection(db, 'businesses'), where('university_id', '==', universityId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getFeed(universityId: string) {
  const fn = httpsCallable(functions, 'getFeed')
  const result = await fn({ universityId })
  return (result.data as { items: any[] }).items
}
```

---

## AuthContext.tsx — The Most Important File You Write
This wraps the entire app and syncs Firebase Auth state to Zustand.
Must go in `App.tsx` around `<BrowserRouter>`.

```ts
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../api/firebase'
import { useAuthStore } from '../store/useAuthStore'
import { useBuzzStore } from '../store/useBuzzStore'

export function AuthContext({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Live listener on user doc — Buzz balance updates in real time
        const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            useAuthStore.getState().setUser({ uid: firebaseUser.uid, ...data } as any)
            useBuzzStore.getState().setBalance(data.buzz_balance ?? 0)
          }
        })
        return unsubDoc
      } else {
        useAuthStore.getState().logout()
        useBuzzStore.getState().setBalance(0)
      }
    })
    return unsubAuth
  }, [])

  return <>{children}</>
}
```

---

## PostPinModal — Coordinate with Shafi
Step 3 of the modal lets the user click the map to pick a location.
Shafi exposes `onMapClick?: (lat: number, lng: number) => void` on `MapView`.
Ask him when that prop is ready. Until then, build steps 1 and 2 independently.

## Updating App.tsx (shared file)
When AuthContext and your pages are ready, add to App.tsx:
```ts
// Wrap the router:
<AuthContext>
  <BrowserRouter> ... </BrowserRouter>
</AuthContext>

// Add routes:
<Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/map" />} />
<Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
```
Do not touch Shafi's routes or reformat the file.

---

## Seed Scripts — Kent State Data

### `scripts/seed_universities.py`
```python
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

db.collection('universities').document('kent-state').set({
    'name': 'Kent State University',
    'lat': 41.1520,
    'lng': -81.3412,
    'domain': 'kent.edu'
})
print('Universities seeded.')
```

### `scripts/seed_demo_pins.py` (run last, after auth is working)
Create 15+ pins of mixed types with realistic titles:
- Events: "CS Club Weekly Meeting", "Frisbee on the Commons", "Study Group — Calc II"
- Volunteer: "Campus Cleanup Crew", "Food Bank Volunteer Shift"
- Help: "Need a ride to airport", "Can someone proofread my essay?"
- Business: "Rays Place — 10% off with Kent ID", "Brady's — free cookie with coffee"

Seed 10 user accounts with different `color` values for visual variety on the map.

---

## Do Not
- Do not write to `frontend/src/store/` — import from it
- Do not write to `functions/` — that's Tirsan's
- Do not touch `frontend/src/components/map/`, `store/`, or `pages/Landing+Map`
- Do not commit `serviceAccountKey.json` — ever, under any circumstance

## How to Keep This File Current
Tick off checkboxes in **Current Status** as each file is completed.
If the `joinPin` or `createPin` signatures change, update the examples here.
If Tirsan adds a new Cloud Function, add a wrapper for it in `api/` and document it here.
