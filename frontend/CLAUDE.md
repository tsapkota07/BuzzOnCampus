# Frontend CLAUDE.md — Shafi's Zone
# Primary owner: Shafi | Read root CLAUDE.md first.
# Last updated: FeedPage built (/feed), Navbar "Settings" → "Feed", phases 11.5–16 planned in plan.md (seed data, admin system, volunteer hours, 3D model pins, geofence-in-3D).

## What You Own
Everything in `frontend/` EXCEPT these (Sumaiya's):
- `src/components/auth/`
- `src/components/pins/`
- `src/components/profile/`
- `src/api/` — import from here, never write
- `src/pages/AuthPage.tsx`
- `src/pages/ProfilePage.tsx`

## Current Status
Update these as you build. Claude reads this to know what exists.

- [x] Project structure created (`package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`)
- [x] `src/main.tsx` — React root render
- [x] `src/App.tsx` — router shell (routes commented out, uncomment as pages are built)
- [x] `src/index.css` — Tailwind base styles
- [x] `src/store/useAuthStore.ts` — scaffolded
- [x] `src/store/useMapStore.ts` — full store: livePins, selectedPin, selectedPlace, createPinContext, pinPlacementMode, hoveredPlace, HoveredPlace type
- [x] `src/store/useBuzzStore.ts` — scaffolded
- [x] `src/components/map/MapView.tsx` — live pins, GPS dot, auto-center, placement mode, geofence overlay, out-of-bounds toast
- [x] `src/components/map/AvatarMarker.tsx` — 3D rotating avatar marker (red.glb for all types — Phase 16 will add per-type models)
- [x] `src/components/map/DetailPanel.tsx` — pin detail, place detail, inline CreatePinForm (2-step), placement mode preview views
- [x] `src/components/ui/Navbar.tsx` — filter toggles (event/volunteer/help/places), avatar dropdown with Profile + Feed + Log Out
- [x] `src/api/pins.ts` — `createPin()`, `subscribeToPins()` (Firestore onSnapshot), `FirestorePin` + `CreatePinInput` types
- [x] `src/utils/universityCoords.ts` — coords + 5-mile radiusM per university, `isWithinCampus()`, `isRestrictedAccount()`
- [x] `src/pages/LandingPage.tsx` — university selector + photo slideshow, passes signup data via router state to AuthPage
- [x] `src/pages/NotFoundPage.tsx` — custom 404 with Go Back / Back to Home
- [x] `src/pages/MapPage.tsx` — mounts MapView + DetailPanel, "Drop a Buzz" button, ESC cancels placement mode
- [x] `src/pages/FeedPage.tsx` — live pin list + places, filter chips, pin detail view, place detail view, at `/feed`
- [x] `src/pages/ProfilePage.tsx` — user banner, stats (buzz balance, pins posted, vol. hours), avatar color display
- [ ] `src/pages/AdminPage.tsx` — pending volunteer hour approvals (Phase 14)
- [ ] `src/api/participations.ts` — getUserParticipations(), getPin() (Phase 12)
- [ ] `src/api/admin.ts` — isAdmin(), getPendingHoursRequests() (Phase 14)
- [ ] Past/upcoming events sections in ProfilePage (Phase 12)
- [ ] Volunteer hours field in CreatePinForm (Phase 13)
- [ ] Geofence boundary line visible in 3D mode (Phase 15)
- [ ] Per-type 3D model pins with WebGL context guard (Phase 16)

## Getting Started
```bash
cd frontend
npm install
cp .env.example .env        # fill in Firebase config + Mapbox token (get from Tirsan)
npm run dev                  # runs on http://localhost:5173
```

## Zustand Stores (already scaffolded — use as-is)
Sumaiya depends on these exact shapes. Do not rename fields.

```ts
// useAuthStore  (src/store/useAuthStore.ts)
interface AppUser {
  uid: string
  email: string
  university_id: string
  buzz_balance: number
  color: string
  avatar_url: string | null
}
{ user: AppUser | null, setUser(u: AppUser | null), logout() }

// useMapStore  (src/store/useMapStore.ts)
type PinType = 'event' | 'volunteer' | 'help' | 'business'
interface Pin {
  id: string
  user_id: string
  user_color: string
  type: PinType
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
{ pins: Pin[], filters: PinType[], setPins(p[]), addPin(p), updatePin(id, updates), removePin(id), setFilters(f[]) }

// useBuzzStore  (src/store/useBuzzStore.ts)
{ balance: number, setBalance(n: number) }
```

## Key Architecture Decisions (read before editing map components)

- **PostPinModal is deleted.** Pin creation lives in `DetailPanel.tsx` as `CreatePinForm` (inline 2-step form).
- **Pin placement mode** (`pinPlacementMode` in MapStore): "Drop a Buzz" enters this mode instead of opening the form directly. User hovers buildings on map → panel previews → click confirms → form opens with building locked. ESC cancels.
- **`placementModeRef`** in MapView: Mapbox `onLoad` handlers are registered once and can't read React state. A `useRef` is kept in sync via `useEffect` so Mapbox handlers can read it.
- **`hoveredPlace`** must NOT be cleared on map mouse leave — only on `onMouseMove` over empty space — so the "Click to pin here" button in the panel still has a valid target.
- **`pendingCenterRef` + `centeredRef`**: GPS fix can arrive before or after Mapbox `onLoad`. These refs bridge the timing gap so the map centers exactly once.
- **Geofence**: `universityCoords.ts` owns all radius values. Both the frontend helpers and `firestore.rules` must be kept in sync (same radii). Currently 8047m (5 miles) for all universities.
- **`other`/`general` university_id** → `Infinity` radius → no posting restrictions anywhere.

## Building MapView.tsx
```ts
import Map, { Layer, Source } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Map centers on user's university coordinates
// Get university from: import { db } from '../api/firebase'
//   then: getDoc(doc(db, 'universities', user.university_id))

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// 3D buildings — add as a Layer inside Map
const buildingsLayer = {
  id: 'add-3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion' as const,
  minzoom: 15,
  paint: {
    'fill-extrusion-color': '#aaa',
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.6,
  },
}

// onSnapshot subscription belongs in MapView useEffect
// See root CLAUDE.md "Real-time Pins Pattern" for the query
```

## Building AvatarMarker.tsx
```ts
import { Marker } from 'react-map-gl'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

// .glb file goes in frontend/public/avatar.glb
// Color override at runtime: traverse mesh materials and set color from pin.user_color
```

## Pin Colors (use these exact hex values)
```ts
const PIN_COLORS: Record<PinType, string> = {
  event: '#3B82F6',
  volunteer: '#22C55E',
  help: '#EAB308',
  business: '#A855F7',
}
```

## Coordination Notes

**PostPinModal is deleted** — pin creation is now inline in `DetailPanel.tsx` as `CreatePinForm`.
No Sumaiya handoff needed for pin creation.

**Join button** in `DetailPanel` pin detail view exists but `joinPin()` Cloud Function is not yet
wired — placeholder only. Tirsan needs to deploy the function first.

## Updating App.tsx (shared file — minimal edits only)
Current routes: `/` → LandingPage, `/auth` → AuthPage, `/map` → MapPage, `/profile` → ProfilePage,
`/feed` → FeedPage, `*` → NotFoundPage.
When adding new pages, follow the same guarded pattern: `user ? <Page /> : <Navigate to="/" replace />`.
Do not reformat existing routes.

## Do Not
- Do not write to `src/api/` — import from it
- Do not write to `src/components/auth/`, `pins/`, `profile/`
- Do not hardcode Firebase config — always use `import.meta.env.VITE_*`
- Do not install packages without telling team (it changes `package.json`)

## How to Keep This File Current
Tick off checkboxes in **Current Status** as you complete each component.
If you add a new prop contract with Sumaiya, document it here.
