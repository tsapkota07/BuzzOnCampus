# Frontend CLAUDE.md — Shafi's Zone
# Primary owner: Shafi | Read root CLAUDE.md first.
# Last updated: MapView, AvatarMarker, LandingPage, NotFoundPage, MapPage built. Auth pages built by Sumaiya.

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
- [x] `src/store/useMapStore.ts` — scaffolded with Pin type, all actions
- [x] `src/store/useBuzzStore.ts` — scaffolded
- [x] `src/components/map/MapView.tsx`
- [x] `src/components/map/AvatarMarker.tsx`
- [ ] `src/components/map/PinMarker.tsx`
- [ ] `src/components/map/PinDetailSidebar.tsx`
- [ ] `src/components/map/FilterButtons.tsx`
- [ ] `src/components/ui/Navbar.tsx`
- [x] `src/pages/LandingPage.tsx` — university selector + photo slideshow, passes signup data via router state to AuthPage
- [x] `src/pages/NotFoundPage.tsx` — custom 404 with Go Back / Back to Home
- [x] `src/pages/MapPage.tsx`

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

## PinDetailSidebar.tsx — what you build vs what Sumaiya wires
You build: the shell, layout, title/description/type/buzz_reward display, and placeholder join/accept button.
Sumaiya wires: the `onClick` handlers on those buttons to call `joinPin()` / `completePinFn()`.
The handoff prop: pass `pin` as a prop, Sumaiya will import and use the component.

## One Coordination Point with Sumaiya
`PostPinModal` (Sumaiya's) needs to know where the user clicked on the map.
Expose this on MapView:
```ts
// MapView.tsx props
interface MapViewProps {
  onMapClick?: (lat: number, lng: number) => void
}
// Inside: <Map onClick={e => onMapClick?.(e.lngLat.lat, e.lngLat.lng)} ...>
```
Tell Sumaiya when this prop is live.

## Updating App.tsx (shared file — minimal edits only)
When your pages are ready, uncomment and add your routes:
```ts
import LandingPage from './pages/LandingPage'
import MapPage from './pages/MapPage'
// Add: <Route path="/" element={<LandingPage />} />
// Add: <Route path="/map" element={user ? <MapPage /> : <Navigate to="/auth" />} />
```
Do not reformat Sumaiya's routes.

## Do Not
- Do not write to `src/api/` — import from it
- Do not write to `src/components/auth/`, `pins/`, `profile/`
- Do not hardcode Firebase config — always use `import.meta.env.VITE_*`
- Do not install packages without telling team (it changes `package.json`)

## How to Keep This File Current
Tick off checkboxes in **Current Status** as you complete each component.
If you add a new prop contract with Sumaiya, document it here.
