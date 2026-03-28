# Bridge CLAUDE.md — Sumaiya's Zone
# Primary owner: Sumaiya | Read root CLAUDE.md first.

## Your Role
You are the bridge. You own auth forms + the Firebase API layer on the frontend,
Firestore security rules, and all seed/demo data scripts. You wire the frontend to Firebase
and connect Shafi's map components to real data.

## Your Files

### Frontend (in `frontend/src/`)
```
api/
  firebase.ts           ← Firebase app init (already scaffolded — do not change)
  auth.ts               ← register(), login(), logout(), onAuthChange()
  pins.ts               ← getPins(), createPin(), joinPin(), completePin(), getPin()
  users.ts              ← getUser(), getUniversities(), getBusinesses(), getFeed()

components/auth/
  SignupForm.tsx         ← .edu email, university dropdown, color picker → calls register()
  LoginForm.tsx          ← email + password → calls login()
  AuthContext.tsx        ← wraps App, listens to Firebase auth state, syncs useAuthStore

components/pins/
  PostPinModal.tsx       ← step 1: category, step 2: details + buzz reward,
                           step 3: click map for lat/lng → calls createPin()
  PinCard.tsx            ← used in PinFeed, shows title/type/buzz
  PinFeed.tsx            ← vertical feed using getFeed() callable function

components/profile/
  UserProfile.tsx        ← shows avatar, university, Buzz balance, volunteer hours

pages/
  AuthPage.tsx           ← route wrapper for SignupForm / LoginForm
  ProfilePage.tsx        ← route wrapper for UserProfile
```

### Firebase Config (repo root)
```
firestore.rules          ← yours entirely — security rules for all collections
```

### Scripts (repo root `scripts/`)
```
seed_universities.py     ← uses Firebase Admin SDK to seed universities collection
seed_businesses.py       ← seeds 10 businesses per university
seed_demo_pins.py        ← seeds 15+ realistic demo pins + 10 demo users
```

## Key Implementation Patterns

### auth.ts — Firebase Auth wrappers
```ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function register(email: string, password: string, universityId: string, color: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // Create user doc in Firestore — onUserCreated Cloud Function will award 20 Buzz Points
  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    university_id: universityId,
    buzz_balance: 0,   // Cloud Function sets this to 20
    color,
    avatar_url: null,
    created_at: serverTimestamp(),
  })
  return cred.user
}
```

### AuthContext.tsx — sync Firebase auth to Zustand
```ts
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../api/firebase'
import { useAuthStore } from '../store/useAuthStore'
import { useBuzzStore } from '../store/useBuzzStore'

export function AuthContext({ children }) {
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const unsub = onSnapshot(doc(db, 'users', firebaseUser.uid), snap => {
          const data = snap.data()
          useAuthStore.getState().setUser({ uid: firebaseUser.uid, ...data })
          useBuzzStore.getState().setBalance(data?.buzz_balance ?? 0)
        })
        return unsub
      } else {
        useAuthStore.getState().logout()
      }
    })
  }, [])
  return children
}
```

### pins.ts — Firestore pin operations
```ts
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import { useAuthStore } from '../store/useAuthStore'

export async function createPin(data: Omit<Pin, 'id' | 'created_at' | 'status' | 'participant_count'>) {
  return addDoc(collection(db, 'pins'), {
    ...data,
    status: 'active',
    participant_count: 0,
    created_at: serverTimestamp(),
  })
}

export async function joinPin(pinId: string) {
  const user = useAuthStore.getState().user!
  const pinRef = doc(db, 'pins', pinId)
  await addDoc(collection(db, 'participations'), {
    pin_id: pinId,
    user_id: user.uid,
    status: 'joined',
    joined_at: serverTimestamp(),
  })
  await updateDoc(pinRef, { participant_count: /* increment */ })
}

export async function completePinFn(pinId: string) {
  const fn = httpsCallable(functions, 'completePin')
  return fn({ pinId })
}
```

### PostPinModal — map click for lat/lng
Coordinate with Shafi on this one callback:
```ts
// Shafi exposes this prop on MapView:
//   onMapClick?: (lat: number, lng: number) => void
// You pass a state setter to it from PostPinModal
```

### Seed Scripts (Python + Firebase Admin SDK)
```python
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Kent State University
db.collection('universities').document('kent-state').set({
    'name': 'Kent State University',
    'lat': 41.1520,
    'lng': -81.3412,
    'domain': 'kent.edu'
})
```
Get `serviceAccountKey.json` from Firebase Console → Project Settings → Service Accounts.
**Never commit this file** — it's in `.gitignore`.

## Coordination Points
- `App.tsx` — add your routes (`/auth`, `/profile`) without touching Shafi's routes
- `PostPinModal` — needs a map click callback from Shafi's `MapView` — ask him for the prop name
- When Tirsan adds a new Cloud Function — you may need to add a wrapper in `api/pins.ts` or `api/users.ts`

## Do Not
- Do not write to `frontend/src/store/` — import from it
- Do not write to `functions/` — that's Tirsan's
- Do not touch `frontend/src/components/map/`
- Do not commit `serviceAccountKey.json` — ever
