# BuzzOnCampus — Frontend

React + Vite + TypeScript frontend for the BuzzOnCampus live campus map platform.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Mapbox GL JS** via `react-map-gl` — interactive 3D campus map
- **React Three Fiber** + **Drei** — 3D avatar markers
- **Tailwind CSS** — utility-first styling
- **Zustand** — global state (auth, map, buzz balance)
- **Firebase SDK v10** — Auth, Firestore, Cloud Functions

## Getting Started

```bash
# From the repo root
cd frontend
npm install
cp .env.example .env   # fill in VITE_MAPBOX_TOKEN (get from Tirsan)
npm run dev            # runs on http://localhost:5173
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_MAPBOX_TOKEN` | Mapbox public access token |

Firebase config is hardcoded in `src/api/firebase.ts` — no env vars needed for Firebase.

## Project Structure

```
src/
├── api/
│   └── firebase.ts          # Firebase app init — auth, db, functions exports
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx     # Email + password sign-in
│   │   ├── SignupForm.tsx    # Signup with OTP trigger
│   │   └── OtpScreen.tsx    # 6-digit OTP input, 10-min timer, 3 attempts
│   ├── map/
│   │   ├── MapView.tsx      # Mapbox map with 3D buildings toggle
│   │   ├── AvatarMarker.tsx # 3D rotating avatar marker (red.glb)
│   │   ├── PlaceMarker.tsx  # Place pin marker
│   │   └── DetailPanel.tsx  # Slide-in panel for pin/place details
│   ├── pins/
│   │   └── PostPinModal.tsx # Drop a Buzz modal (2-step: type → details)
│   └── ui/
│       └── Navbar.tsx       # Top bar: wordmark, search, buzz balance, avatar dropdown
├── pages/
│   ├── LandingPage.tsx      # University selector + photo slideshow
│   ├── AuthPage.tsx         # Hosts LoginForm / SignupForm / OtpScreen
│   ├── MapPage.tsx          # Map view with Drop a Buzz button
│   └── NotFoundPage.tsx     # Custom 404
├── store/
│   ├── useAuthStore.ts      # User session state
│   ├── useMapStore.ts       # Pins, filters, selected pin/place
│   └── useBuzzStore.ts      # Buzz balance
└── App.tsx                  # Router + auth guard
```

## Routing & Auth Guard

| Route | Unauthenticated | Authenticated |
|-------|----------------|---------------|
| `/` | LandingPage | → `/map` |
| `/auth` | AuthPage | → `/map` |
| `/map` | → `/` | MapPage |
| `*` | NotFoundPage | NotFoundPage |

## Auth Flow

1. User selects university on LandingPage → navigates to `/auth`
2. **Signup:** email → OTP sent via `sendOtp` Cloud Function → OTP verified → account created
3. **Login:** email + password → Firebase `signInWithEmailAndPassword` → Firestore user doc loaded
4. On logout: Firebase `signOut()` → Zustand cleared → redirected to `/`

## Calling Cloud Functions

```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from './api/firebase'

const sendOtp = httpsCallable(functions, 'sendOtp')
await sendOtp({ email: 'student@kent.edu' })
```

## Running Tests

```bash
npm test              # run all tests
npm test -- --reporter=verbose   # with test names
```

Tests cover: route guard, auth store, email validation.

## Building for Production

```bash
npm run build         # outputs to dist/
```

Deploy via `firebase deploy --only hosting` from the repo root.

## Test Accounts

All test accounts use password: `password`

| Email | University |
|-------|------------|
| test1@ysu.edu | YSU |
| test2@ysu.edu | YSU |
| test1@kent.edu | Kent State |
| test2@kent.edu | Kent State |
| test1@osu.edu | OSU |
| test2@osu.edu | OSU |
| test@gmail.com | General |
