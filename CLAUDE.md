# BuzzOnCampus — Root CLAUDE.md
# Everyone reads this. Single source of truth for shared rules.

## Project
BuzzOnCampus — live 3D campus map platform. Kent State Hackathon, March 28–29, 18–20 hours.
Team: Shafi (frontend), Tirsan (Cloud Functions), Sumaiya (bridge — forms, API layer, rules, seed data).
See `design_doc.md` for full feature spec. See `file_system.md` for ownership map.

## Stack
- Frontend: React + Vite + TypeScript, Mapbox GL, React Three Fiber, Tailwind, Zustand, Firebase SDK
- Backend: Firebase (Auth, Firestore, Cloud Functions, Hosting) — no custom server
- Deployment: `firebase deploy` — one command for everything

## Firebase Setup (do this first before writing any code)
1. Go to console.firebase.google.com → create project "buzzoncampus"
2. Enable: Authentication (Email/Password), Firestore, Functions, Hosting
3. Add a Web App → copy the config values into `frontend/.env` (see `.env.example`)
4. Install Firebase CLI: `npm install -g firebase-tools` → `firebase login`

## Firestore Data Model

### Collections
```
users/{uid}
  email: string
  university_id: string
  buzz_balance: number          # starts at 20
  color: string                 # hex color chosen at signup
  avatar_url: string | null
  created_at: Timestamp

pins/{pinId}
  user_id: string
  user_color: string            # denormalized for map rendering
  type: 'event'|'volunteer'|'help'|'business'
  title: string
  description: string
  buzz_reward: number
  lat: number
  lng: number
  status: 'active'|'completed'|'cancelled'
  university_id: string
  event_date: Timestamp | null
  participant_count: number
  created_at: Timestamp

participations/{participationId}
  pin_id: string
  user_id: string
  status: 'joined'|'completed'
  joined_at: Timestamp

transactions/{transactionId}
  from_user_id: string
  to_user_id: string
  amount: number
  pin_id: string
  created_at: Timestamp

universities/{universityId}
  name: string
  lat: number
  lng: number
  domain: string                # e.g. 'kent.edu'

businesses/{businessId}
  name: string
  description: string
  deal: string
  lat: number
  lng: number
  university_id: string
```

## Pin Colors
| type | color |
|------|-------|
| event | blue (#3B82F6) |
| volunteer | green (#22C55E) |
| help | yellow (#EAB308) |
| business | purple (#A855F7) |

## Cloud Functions (Tirsan's, called from frontend)
| Function | What it does |
|----------|-------------|
| `validateEduEmail` | Auth trigger — blocks non-.edu signups |
| `onUserCreated` | Firestore trigger — awards 20 Buzz Points on user doc creation |
| `completePin` | Callable — atomic Buzz Points transfer + pin status update |
| `getFeed` | Callable — returns recent pins for a university |

Call pattern from frontend:
```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from './api/firebase'
const completePin = httpsCallable(functions, 'completePin')
await completePin({ pinId })
```

## Real-time Map Updates (no WebSockets needed)
```ts
// Subscribe to active pins for a university — updates live
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from './api/firebase'

const q = query(
  collection(db, 'pins'),
  where('university_id', '==', universityId),
  where('status', '==', 'active')
)
const unsubscribe = onSnapshot(q, snapshot => {
  const pins = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  useMapStore.getState().setPins(pins)
})
```

## Shared Rules
- Never commit `frontend/.env` — fill it from `frontend/.env.example`
- `frontend/src/api/` is Sumaiya's — Shafi imports from it, never writes
- `frontend/src/store/` is Shafi's — Sumaiya imports from it, never writes
- `functions/src/` is Tirsan's — Sumaiya/Shafi never edit it
- `firestore.rules` is Sumaiya's — Tirsan/Shafi never edit it
- `scripts/` is Sumaiya's — seed data only
- Branch: work on your own branch (`shafi`, `tirsan`, `sumaiya`), merge to `main` only when tested

## What NOT to build
- Rating/reputation system
- Leaderboard
- In-app chat
- SSN or I-20 verification
- Partner redemption portal
- Push notifications
