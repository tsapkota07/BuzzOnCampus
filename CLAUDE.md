# BuzzOnCampus — Root CLAUDE.md
# Read by everyone. Updated as the project evolves.
# Last updated: project scaffold complete, no feature code written yet.

## Project
BuzzOnCampus — live 3D campus map platform built at Kent State Hackathon, March 28–29 (18–20 hrs).
Team: Shafi (frontend/map), Tirsan (Cloud Functions/deploy), Sumaiya (auth/API layer/seed data).
Repo: https://github.com/tsapkota07/BuzzOnCampus
Full spec: `design_doc.md` | File ownership: `file_system.md`

## Stack
- **Frontend:** React 18 + Vite + TypeScript, Mapbox GL JS, React Three Fiber, Tailwind CSS, Zustand, Firebase SDK v10
- **Backend:** Firebase — Auth, Firestore, Cloud Functions (Node 20 + TypeScript), Hosting
- **No custom server.** No AWS. Everything is Firebase.
- **Deploy:** `firebase deploy` — one command for everything

## Current Project Status
Update these checkboxes as things get built. This is how Claude knows what exists.

### Foundation
- [x] Repo scaffolded and pushed to GitHub
- [x] Firebase config files committed (`firebase.json`, `firestore.rules`, `firestore.indexes.json`)
- [x] Frontend project structure created (Vite + React + TS, Tailwind, all deps in `package.json`)
- [x] Zustand stores scaffolded (`useAuthStore`, `useMapStore`, `useBuzzStore`)
- [x] Firebase app init scaffolded (`frontend/src/api/firebase.ts`)
- [x] Cloud Functions scaffolded (4 functions written, not yet deployed)
- [ ] Firebase project created in console and `.firebaserc` updated with real project ID
- [ ] `frontend/.env` filled with real Firebase config values

### Auth
- [ ] `SignupForm.tsx` built
- [ ] `LoginForm.tsx` built
- [ ] `AuthContext.tsx` built and wrapping App
- [ ] `.edu` email validation working (via `validateEduEmail` Cloud Function)
- [ ] 20 Buzz Points awarded on signup (via `onUserCreated` Cloud Function)

### Map & Pins
- [ ] `MapView.tsx` built with Mapbox
- [ ] 3D buildings toggle working
- [ ] Pins loading from Firestore (`onSnapshot`)
- [ ] `PinMarker.tsx` rendering pins with correct colors
- [ ] `AvatarMarker.tsx` rendering 3D avatar
- [ ] `PinDetailSidebar.tsx` opens on pin click
- [ ] `FilterButtons.tsx` filtering pins by type

### Pin Actions
- [ ] `PostPinModal.tsx` built (category → details → map click for location)
- [ ] `joinPin()` working
- [ ] `completePin` Cloud Function deployed and tested
- [ ] Buzz Points transfer confirmed working end-to-end

### Feed & Polish
- [ ] `PinFeed.tsx` built (campus activity feed)
- [ ] `UserProfile.tsx` built
- [ ] `LandingPage.tsx` built
- [ ] Buzz balance counter animating in Navbar

### Deployment
- [ ] Cloud Functions deployed (`firebase deploy --only functions`)
- [ ] Frontend built and deployed (`firebase deploy --only hosting`)
- [ ] Seed data loaded into production Firestore
- [ ] Full demo rehearsed

---

## Environment Setup (run once after cloning)
**Run everything from the repo root** (`/BuzzOnCampus/`), not from inside a subfolder.

```bash
# Clone and enter repo
git clone https://github.com/tsapkota07/BuzzOnCampus.git
cd BuzzOnCampus

# Run the setup script — handles Node, frontend, functions, Python venv
bash setup.sh

# Copy env file and fill it in (get values from Tirsan)
cp frontend/.env.example frontend/.env
```

After setup, each person works from their own directory:
```bash
# Shafi — frontend
cd frontend && npm run dev

# Tirsan — functions
cd functions && npm run build
firebase deploy --only functions

# Sumaiya — seed scripts
source scripts/.venv/bin/activate
python scripts/seed_universities.py
```

To add a new Python package (Sumaiya):
```bash
source scripts/.venv/bin/activate
pip install <package>
pip freeze > scripts/requirements.txt   # update the file so teammates get it too
```

---

## Firebase First-Time Setup
**Tirsan does this once, then shares config with team.**
1. Go to console.firebase.google.com → create project (name it anything, e.g. `buzzoncampus`)
2. Enable in console: **Authentication** (Email/Password), **Firestore** (production mode), **Functions**, **Hosting**
3. Add a **Web App** → copy the config object
4. Update `.firebaserc` with the real project ID
5. Share the config values with Shafi and Sumaiya so they can fill `frontend/.env`
6. Install CLI: `npm install -g firebase-tools` then `firebase login`

---

## Firestore Collections & Fields
**Do not rename fields without telling the whole team — they are used across frontend, functions, and seed scripts.**

```
users/{uid}
  email: string
  university_id: string
  buzz_balance: number          # starts at 20, managed by Cloud Functions
  color: string                 # hex e.g. '#14B8A6'
  avatar_url: string | null
  created_at: Timestamp

pins/{pinId}
  user_id: string
  user_color: string            # copied from user at pin creation time
  type: 'event'|'volunteer'|'help'|'business'
  title: string
  description: string
  buzz_reward: number
  lat: number
  lng: number
  status: 'active'|'completed'|'cancelled'
  university_id: string
  event_date: Timestamp | null
  participant_count: number     # incremented by joinPin()
  created_at: Timestamp

participations/{participationId}
  pin_id: string
  user_id: string
  status: 'joined'|'completed'
  joined_at: Timestamp

transactions/{transactionId}
  from_user_id: string          # 'system' if awarded (not deducted)
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

## Pin Types & Colors
| type | color | hex |
|------|-------|-----|
| event | blue | #3B82F6 |
| volunteer | green | #22C55E |
| help | yellow | #EAB308 |
| business | purple | #A855F7 |

## Cloud Functions Reference
Tirsan owns these. Sumaiya calls them via `httpsCallable`. Shafi does not call them directly.

| Function | Type | Trigger | What it does |
|----------|------|---------|-------------|
| `validateEduEmail` | Auth trigger | Before user created | Blocks non-.edu registration |
| `onUserCreated` | Firestore trigger | On `users/{uid}` create | Sets `buzz_balance` to 20 |
| `completePin` | Callable | Called by frontend | Atomic Buzz transfer + sets pin status to 'completed' |
| `getFeed` | Callable | Called by frontend | Returns 30 most recent active pins for a university |

**Calling a function from frontend:**
```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from '../api/firebase'

const completePin = httpsCallable(functions, 'completePin')
const result = await completePin({ pinId: 'abc123' })
```

## Real-time Pins Pattern
Firestore replaces WebSockets. Use `onSnapshot` in `MapView.tsx`:
```ts
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase'
import { useMapStore } from '../store/useMapStore'

const q = query(
  collection(db, 'pins'),
  where('university_id', '==', user.university_id),
  where('status', '==', 'active')
)
const unsub = onSnapshot(q, snapshot => {
  const pins = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Pin))
  useMapStore.getState().setPins(pins)
})
// Return unsub in useEffect cleanup
```

## Ownership Rules (enforced by branches)
| Zone | Owner | Rule |
|------|-------|------|
| `frontend/src/components/map/` | Shafi | No one else edits |
| `frontend/src/store/` | Shafi | Others import only |
| `frontend/src/api/` | Sumaiya | Others import only |
| `frontend/src/components/auth/` | Sumaiya | No one else edits |
| `frontend/src/components/pins/` | Sumaiya | No one else edits |
| `firestore.rules` | Sumaiya | No one else edits |
| `functions/src/` | Tirsan | No one else edits |
| `firestore.indexes.json` | Tirsan | No one else edits |
| `App.tsx` | Shared | Add your route, don't reformat others |

## Git Branches
- `shafi` — Shafi's branch
- `tirsan` — Tirsan's branch
- `sumaiya` — Sumaiya's branch
- `main` — merge here only when a full feature is tested end-to-end

## Do Not Build
- Rating/reputation system, Leaderboard, In-app chat
- SSN or I-20 verification, Partner redemption portal, Push notifications

## How to Keep This File Current
When you finish a feature, check off the box in **Current Project Status**.
When you add a new Cloud Function, add it to the **Cloud Functions Reference** table.
When field names change, update the **Firestore Collections** section.
