# Frontend CLAUDE.md — Shafi's Zone
# Primary owner: Shafi | Read root CLAUDE.md first.

## Your Ownership
You own everything in `frontend/` EXCEPT:
- `frontend/src/components/auth/` → Sumaiya
- `frontend/src/components/pins/` → Sumaiya
- `frontend/src/components/profile/` → Sumaiya
- `frontend/src/api/` → Sumaiya (import from here, never write)
- `frontend/src/pages/AuthPage.tsx` → Sumaiya
- `frontend/src/pages/ProfilePage.tsx` → Sumaiya

## Your Files
```
src/components/map/
  MapView.tsx           ← Mapbox map, 3D buildings toggle, viewport, onSnapshot subscription
  AvatarMarker.tsx      ← React Three Fiber, .glb model, runtime color swap
  PinMarker.tsx         ← color-coded circle/icon markers per pin type
  PinDetailSidebar.tsx  ← slide-in panel on click — render only, Sumaiya wires buttons
  FilterButtons.tsx     ← category toggle buttons, writes to useMapStore.setFilters

src/store/              ← yours entirely
  useAuthStore.ts       ← { user, setUser, logout } — already scaffolded
  useMapStore.ts        ← { pins, filters, setPins, addPin, updatePin, removePin, setFilters }
  useBuzzStore.ts       ← { balance, setBalance }

src/pages/
  LandingPage.tsx       ← hero, tagline, animated stats, sign up CTA
  MapPage.tsx           ← full map view, imports all map/ components

src/components/ui/
  Navbar.tsx            ← build the shell + Buzz balance display (reads useBuzzStore)
```

## Getting Started
```bash
cd frontend
npm install
cp .env.example .env   # fill in Firebase config + Mapbox token
npm run dev
```

## Mapbox Setup
```ts
// In MapView.tsx — map centers on the user's university
import Map, { Layer, Source } from 'react-map-gl'

const MAP_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// 3D buildings layer
const buildingsLayer = {
  id: 'building',
  source: 'composite',
  'source-layer': 'building',
  type: 'fill-extrusion',
  paint: { 'fill-extrusion-height': ['get', 'height'] }
}
```

## Real-time Pins (Firestore onSnapshot — no WebSocket needed)
```ts
// In MapView.tsx or a useEffect in MapPage.tsx
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase'

useEffect(() => {
  const q = query(
    collection(db, 'pins'),
    where('university_id', '==', user.university_id),
    where('status', '==', 'active')
  )
  const unsub = onSnapshot(q, snapshot => {
    const pins = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Pin))
    useMapStore.getState().setPins(pins)
  })
  return unsub // cleanup on unmount
}, [user.university_id])
```

## Zustand Store Contracts
These shapes are what Sumaiya depends on — do not rename fields without telling her.
```ts
// useAuthStore — AppUser defined in the file
{ user: AppUser | null, setUser(u), logout() }

// useMapStore
{ pins: Pin[], filters: PinType[], setPins(p[]), addPin(p), updatePin(id, updates), removePin(id), setFilters(f[]) }

// useBuzzStore
{ balance: number, setBalance(n) }
```

## Buzz Balance in Navbar
```ts
// Navbar.tsx — reads live from Firestore, updates useBuzzStore
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase'
import { useBuzzStore } from '../store/useBuzzStore'

// In a useEffect when user is set:
const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
  useBuzzStore.getState().setBalance(snap.data()?.buzz_balance ?? 0)
})
```

## Do Not
- Do not install packages without announcing to team
- Do not write to `src/api/` — import from it
- Do not hardcode Firebase config — use `import.meta.env.VITE_*`
- Do not touch `src/components/auth/`, `pins/`, `profile/`
