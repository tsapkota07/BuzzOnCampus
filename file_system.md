# BuzzOnCampus — File System & Ownership Map

## Directory Structure

```
BuzzOnCampus/
├── CLAUDE.md                          # Root — everyone reads this
├── design_doc.md
├── file_system.md                     # This file
├── firebase.json                      # Firebase hosting/functions/firestore config
├── .firebaserc                        # Firebase project alias
├── firestore.rules                    # SUMAIYA — Firestore security rules
├── firestore.indexes.json             # TIRSAN — composite query indexes
├── .gitignore
│
├── frontend/                          # PRIMARY: Shafi | SECONDARY: Sumaiya (auth, pins, api)
│   ├── CLAUDE.md                      # Shafi's guide
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── index.css
│       ├── App.tsx                    # Routes only — add your route, don't reformat others
│       ├── components/
│       │   ├── map/                   # SHAFI ONLY
│       │   │   ├── MapView.tsx
│       │   │   ├── AvatarMarker.tsx
│       │   │   ├── PinMarker.tsx
│       │   │   ├── PinDetailSidebar.tsx
│       │   │   └── FilterButtons.tsx
│       │   ├── auth/                  # SUMAIYA ONLY
│       │   │   ├── SignupForm.tsx
│       │   │   ├── LoginForm.tsx
│       │   │   └── AuthContext.tsx
│       │   ├── pins/                  # SUMAIYA ONLY
│       │   │   ├── PostPinModal.tsx
│       │   │   ├── PinCard.tsx
│       │   │   └── PinFeed.tsx
│       │   ├── profile/               # SUMAIYA ONLY
│       │   │   └── UserProfile.tsx
│       │   └── ui/                    # SHARED — coordinate before editing
│       │       ├── Navbar.tsx
│       │       ├── Toast.tsx
│       │       └── Button.tsx
│       ├── store/                     # SHAFI ONLY — others import, never write
│       │   ├── useAuthStore.ts        ← scaffolded
│       │   ├── useMapStore.ts         ← scaffolded
│       │   └── useBuzzStore.ts        ← scaffolded
│       ├── api/                       # SUMAIYA ONLY — others import, never write
│       │   ├── firebase.ts            ← scaffolded (Firebase app init)
│       │   ├── auth.ts
│       │   ├── pins.ts
│       │   └── users.ts
│       ├── hooks/                     # SHARED
│       └── pages/
│           ├── LandingPage.tsx        # SHAFI
│           ├── MapPage.tsx            # SHAFI
│           ├── AuthPage.tsx           # SUMAIYA
│           └── ProfilePage.tsx        # SUMAIYA
│
├── functions/                         # TIRSAN ONLY — Firebase Cloud Functions
│   ├── CLAUDE.md                      # Tirsan's guide
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                   ← scaffolded
│       ├── auth/
│       │   ├── validateEduEmail.ts    ← scaffolded
│       │   └── onUserCreated.ts       ← scaffolded
│       ├── pins/
│       │   └── completePin.ts         ← scaffolded
│       └── feed/
│           └── getFeed.ts             ← scaffolded
│
├── scripts/                           # SUMAIYA ONLY — Firebase Admin seed scripts
│   ├── seed_universities.py
│   ├── seed_businesses.py
│   └── seed_demo_pins.py
│
└── sumaiya/
    └── CLAUDE.md                      # Sumaiya's guide
```

---

## Ownership at a Glance

| Zone | Owner | Rule |
|------|-------|------|
| `frontend/src/components/map/` | Shafi | No one else edits |
| `frontend/src/store/` | Shafi | Others import only |
| `frontend/src/pages/Landing+Map` | Shafi | No one else edits |
| `frontend/src/components/auth/` | Sumaiya | No one else edits |
| `frontend/src/components/pins/` | Sumaiya | No one else edits |
| `frontend/src/components/profile/` | Sumaiya | No one else edits |
| `frontend/src/api/` | Sumaiya | Others import only |
| `frontend/src/pages/Auth+Profile` | Sumaiya | No one else edits |
| `firestore.rules` | Sumaiya | No one else edits |
| `scripts/` | Sumaiya | No one else edits |
| `functions/src/` | Tirsan | No one else edits |
| `firestore.indexes.json` | Tirsan | No one else edits |

## Shared Zones — Coordinate Before Touching

| File | Who | Rule |
|------|-----|------|
| `frontend/src/App.tsx` | Shafi + Sumaiya | Add your route only, don't reformat |
| `frontend/src/components/ui/` | Shafi + Sumaiya | Announce before editing |
| `frontend/package.json` | Shafi primarily | Announce new deps in team chat |
| `firebase.json` | Tirsan primarily | Announce changes |

## Git Branch Strategy
```
main      ← stable only, merge here when a full feature loop is tested
shafi     ← Shafi's branch
tirsan    ← Tirsan's branch
sumaiya   ← Sumaiya's branch
```
Never commit directly to `main`. Never touch another person's ownership zone.
