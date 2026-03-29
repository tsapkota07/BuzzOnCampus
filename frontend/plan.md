# BuzzOnCampus — Frontend Implementation Plan
# Last updated: 2026-03-29
# Phases 1–10, 12–15 complete. Remaining: Phase 11.5B-C (seed demo data), Phase 13C (completePin hours), Phase 14E (dispute flow), Phase 16 (3D model pins).

## What's Done
- Phases 1–10: pin creation, real-time map, placement mode, geofence (2D + 3D), auth
- Phase 11.5A: admin accounts seeded (admin@ysu/kent/osu/gmail.com, password: adminPassword)
- Phase 12: `api/participations.ts` + ProfilePage past/upcoming sections (from user's own posted pins)
- Phase 13A–B: `volunteer_hours` in pin schema + CreatePinForm wired
- Phase 14A–D, 14F: `api/admin.ts`, `AdminPage.tsx`, `approveVolunteerHours` Cloud Function deployed, Navbar Admin link
- Phase 15: geofence circle border visible in 3D mode (separate LineString layer)
- Tests: 79 passing — route guards (all routes), adversarial email, geofence boundary

## What's Left
- **Phase 11.5B–C**: write `scripts/seed_demo_data.mjs` (demo pins + participations for demo)
- **Phase 13C**: update `completePin` Cloud Function to copy `volunteer_hours` into participation doc with `hours_status: 'pending'`
- **Phase 13D**: show pending hours count in ProfilePage (amber "X hrs pending" below stat)
- **Phase 14E**: dispute flow — "Dispute" button on rejected participations in ProfilePage
- **Phase 16**: 3D model pins per type (Alien/Caveman/Dinosaur/Podium), WebGL context guard
- **joinPin**: wire Join button to Cloud Function (Tirsan), increment participant_count
- **Buzz Points**: test completePin end-to-end

---

## Original Context
Firebase is live (project: buzzoncampus-f9257). Auth, Firestore, and Cloud Functions are
all connected. The goal is: user fills PostPinModal → pin writes to Firestore → appears
live on the map for everyone via onSnapshot.

Firestore pin schema:
  user_id, user_color, type, title, description, buzz_reward, volunteer_hours,
  lat, lng, status, university_id, event_date, participant_count, created_at

---

## Phase 1 — Pins API Layer ✅
- [x] Import `db` from `./firebase` and Firestore methods
- [x] Create `createPin(data)` function with `avatar_model` field for sustainable per-user 3D models
- [x] Create `subscribeToPins(university_id, callback)` with onSnapshot, returns unsubscribe
- [x] `FirestorePin` and `CreatePinInput` types exported for use across components

---

## Phase 2 — Add Map Location to PostPinModal ✅
- [x] Add `mapCenter` prop to PostPinModal
- [x] Display "📍 Pinned to current map view" with coordinates in step 2
- [x] MapView exposes `onMapReady(getCenter)` callback
- [x] MapPage snapshots map center when modal opens and passes it down

---

## Phase 3 — Wire PostPinModal Submit to Firestore ✅
- [x] Import `createPin` from `../../api/pins`
- [x] Import `useAuthStore` to get user data
- [x] Loading state on button ("Posting..."), try/catch, error message on failure
- [x] On success: close modal, reset form

---

## Phase 4 — Replace Mock Pins with Firestore onSnapshot ✅
- [x] Remove `mockUserPins` import and usage
- [x] `useEffect` calls `subscribeToPins`, stores mapped pins in MapStore via `setLivePins`
- [x] Filter visible pins using activeFilters

---

## Phase 5 — End-to-End Test ✅
- [x] Post a pin → Firestore doc created → appears on map via onSnapshot
- [x] Second browser tab shows it in real-time

---

## Phase 6 — Post & Join at a Building/POI ✅

### Phase 6A ✅
- [x] `livePins: MockUserPin[]` + `setLivePins` added to MapStore
- [x] `pendingPlacePost` replaced by `createPinContext` (done in Phase 7A)

### Phase 6B ✅
- [x] "POST HERE" button wired through store signal → opens modal with building locked

### Phase 6C ✅
- [x] Haversine `distanceM()` helper in DetailPanel
- [x] `pinsHere`: live pins within 80m of selected building shown with Join button
- [x] Join button → `setSelectedPin(pin)` → switches panel to full pin detail
      TODO: wire to Cloud Function `joinPin` when Tirsan deploys it

---

## Phase 7 — Move Pin Creation into the Side Panel ✅

### Phase 7A ✅
- [x] `createPinContext: { lockedPlace?, mapCenter? } | null` + `setCreatePinContext` in MapStore
- [x] Removed `pendingPlacePost` / `setPendingPlacePost`

### Phase 7B ✅
- [x] "Drop a Buzz" → `setCreatePinContext({ mapCenter })`
- [x] "Post Here" → `setCreatePinContext({ lockedPlace })`

### Phase 7C ✅
- [x] `CreatePinForm` inline in DetailPanel (2-step form, Firestore submit, loading/error states)
- [x] Panel open when `selectedPin || selectedPlace || createPinContext !== null`

### Phase 7D ✅
- [x] Deleted `PostPinModal.tsx`
- [x] Removed PostPinModal import from MapPage.tsx

### Phase 7E — Show Current Location on Map ✅
- [x] `watchPosition` on mount — success stores `userLocation`, error sets `showLocationBanner`
- [x] Pulsing blue "you are here" dot (pulse-ring CSS animation, inner solid dot)
- [x] Location denied → dismissible banner: "📍 Location set to [University Name]"
- [x] Banner text is university-aware (YSU/Kent/OSU/your campus) based on account
- [x] Locate Me button flies to university campus + shows banner regardless of GPS status

### Phase 7F — Auto-center Map on Load ✅
- [x] `universityCoords.ts` created — coords + names for kent, youngstown/ysu, ohio/osu, other
- [x] `pendingCenterRef` bridges timing gap (GPS fix can arrive before or after map loads)
- [x] GPS granted → fly to real position on first fix (zoom 15)
- [x] GPS denied → fly to university campus coords (zoom 15)
- [x] `initialViewState` uses university coords — no more hardcoded YSU for everyone
- [x] `centeredRef` guard ensures fly-to fires only once per session

---

## Phase 8 — Drop a Buzz: Building Selection Mode (Pin Placement)

### Goal
Clicking "Drop a Buzz" enters a **pin placement mode** instead of immediately opening the form.
In this mode:
- The map cursor becomes a custom pin icon (📍)
- As the user moves their mouse, nearby POI/building labels are detected in real time
- The right panel previews whichever building is under the cursor
- Clicking confirms placement → exits placement mode → opens the create-pin form
  with that building name + coords locked in (same as "Post Here" flow)
- ESC or clicking empty map space cancels placement mode

---

### Phase 8A — Add placement mode to MapStore
**File:** `frontend/src/store/useMapStore.ts`

- [ ] Add `pinPlacementMode: boolean`
- [ ] Add `hoveredPlace: { name: string; category: string; lat: number; lng: number } | null`
- [ ] Add `setPinPlacementMode(active: boolean)` action:
      - Setting to `true`: also clears `selectedPin`, `selectedPlace`, `createPinContext`
        (prevents two panel views fighting each other)
      - Setting to `false`: also clears `hoveredPlace`
- [ ] Add `setHoveredPlace(place: { name, category, lat, lng } | null)` action

---

### Phase 8B — Enter placement mode from "Drop a Buzz"
**File:** `frontend/src/pages/MapPage.tsx`

- [ ] "Drop a Buzz" button onClick → `setPinPlacementMode(true)` instead of `setCreatePinContext`
- [ ] `useEffect` listens for `Escape` keydown → `setPinPlacementMode(false)`

---

### Phase 8C — Mouse tracking and cursor change in MapView
**File:** `frontend/src/components/map/MapView.tsx`

**Cursor overlay (pixel tracking):**
- [ ] Add `cursorPos: { x: number; y: number }` local state
- [ ] Add `onMouseMove` on the outer `<div>` wrapper (not the Map) to track pixel position
      for the cursor overlay — this is separate from the geo detection below
- [ ] Render a 📍 overlay div at `cursorPos` (`position: absolute`, `pointerEvents: none`,
      `zIndex: 500`) — only when `pinPlacementMode` is true
- [ ] Set map canvas `cursor: none` when `pinPlacementMode` is true, `''` when false
- [ ] ⚠️ Guard the existing `poi-label` mouseenter/mouseleave cursor handlers in `onLoad`:
      skip setting `cursor: pointer` when `pinPlacementMode` is true (use a ref to read it
      inside the Mapbox event handler)

**POI detection (geo tracking):**
- [ ] Add `onMouseMove` on the `<Map>` component — only runs logic when `pinPlacementMode`:
      - `queryRenderedFeatures(e.point, { layers: ['poi-label'] })`
      - If POI found: run category through `mapboxCategoryToOurs()` (same as onClick),
        extract name, lat, lng → `setHoveredPlace({ name, category, lat, lng })`
      - If no POI: `setHoveredPlace(null)` — but NOT on mouse leave, only on move over
        empty space (so hoveredPlace persists when mouse moves to the panel)

**Preview marker:**
- [ ] Render a semi-transparent pulsing orange `<Marker>` at `hoveredPlace` coords
      when `pinPlacementMode && hoveredPlace`

**onClick intercept:**
- [ ] When `pinPlacementMode` is true, handle click first (early return):
      - `hoveredPlace` exists → `setPinPlacementMode(false)` + `setCreatePinContext({ lockedPlace: hoveredPlace })`
      - No `hoveredPlace` → stay in mode, do nothing
      - Normal POI/map click handler does NOT run

---

### Phase 8D — Right panel preview during placement mode
**File:** `frontend/src/components/map/DetailPanel.tsx`

- [ ] `isOpen` condition adds `|| pinPlacementMode`
- [ ] `pinPlacementMode && !hoveredPlace` → instruction view:
      - 📍 icon, "Hover over a building to place your pin"
      - Cancel button → `setPinPlacementMode(false)`
- [ ] `pinPlacementMode && hoveredPlace` → building preview:
      - Category badge + building name
      - "Click to pin here" CTA button (orange gradient)
        → `setPinPlacementMode(false)` + `setCreatePinContext({ lockedPlace: hoveredPlace })`
        ⚠️ `hoveredPlace` stays valid here because we don't clear it on mouse leave
      - Cancel button → `setPinPlacementMode(false)`

---

### Phase 8E — Exit placement mode cleanly
All exit paths call `setPinPlacementMode(false)` which clears `hoveredPlace` in the action.
Map canvas cursor is restored to `''` via a `useEffect` watching `pinPlacementMode` in MapView.

Exit paths:
- Click confirmed building → opens create form with building locked
- Click empty space → stays in mode
- ESC key → cancel, panel closes
- Cancel button → cancel, panel closes


---

## Phase 10 — University Geofence: Campus-Only Posting

### Goal
University email accounts (any non-`other`/`general` university_id) can only post pins
within their campus radius. They can still browse and view the whole map freely.
General accounts have no restriction. Area outside the campus radius is visually marked
with a semi-transparent red overlay so it's clear what is and isn't their zone.

---

### Adversarial Analysis (read before implementing)

**A1 — Client-side-only bypass**
All frontend checks are UI-level and can be bypassed by anyone with DevTools.
The frontend restriction is UX enforcement only.
⚠️ **Sumaiya must add a Firestore security rule** that validates pin `lat`/`lng` against
the university's radius before allowing a write. Without this, a user can POST to the
Firestore API directly and bypass the whole thing.
Suggested rule helper (Sumaiya implements):
```
function haversineApprox(lat1, lng1, lat2, lng2) {
  // Equirectangular approximation — good enough for < 10km
  let dlat = (lat2 - lat1) * 111320;
  let dlng = (lng2 - lng1) * 111320 * math.cos(lat1 * 3.14159 / 180);
  return math.sqrt(dlat * dlat + dlng * dlng);
}
// In pin create rule: haversineApprox(...) <= universityRadiusM
```
Until that rule is live, the frontend block is the only gate — acceptable for hackathon demo.

**A2 — university_id spoofing**
`university_id` comes from the auth store (loaded from Firestore on login). A user cannot
change it client-side without losing their session. Safe as-is.

**A3 — Coordinate spoofing in CreatePinForm**
The pin's lat/lng are derived from `lockedPlace` (building clicked on map) or `mapCenter`.
A user cannot manually set arbitrary coords in the current UI.
However: if someone reads the source and calls `setCreatePinContext` with spoofed coords,
the frontend form will accept it. This falls under A1 — mitigated only by the backend rule.

**A4 — Radius boundary race condition**
User hovers a building just inside the radius in placement mode, the boundary check passes,
but the building's canonical coords (from Mapbox) might differ slightly from where the user
thought they clicked. Fix: check distance at submit time (Phase 10D) in addition to at
placement confirm time (Phase 10C). Double-gate.

**A5 — 'other'/'general' accounts as escape hatch**
If `university_id` is `other`, `general`, or any unrecognized value → no radius applied
(Infinity). This is intentional — non-university users browse freely. Ensure the radius
lookup explicitly returns `Infinity` for these, not 0 or some default.

---

### Phase 10A — Add radius constants to universityCoords.ts ✅
**File:** `frontend/src/utils/universityCoords.ts`

- [x] Add `radiusM: number` to each entry in `UNIVERSITY_COORDS`
      - `kent`: 2000 (2km — covers Kent campus)
      - `youngstown`/`ysu`: 1800
      - `ohio`/`osu`: 3000 (larger campus)
      - `general`/`other`: `Infinity` (no restriction)
- [x] Export a helper `isRestrictedAccount(university_id: string): boolean`
      — returns `false` if `university_id` is `other`, `general`, or unrecognized
- [x] Export a helper `isWithinCampus(lat: number, lng: number, university_id: string): boolean`
      — returns `true` if within radius OR if account is unrestricted

---

### Phase 10B — Red overlay outside campus radius ✅
**File:** `frontend/src/components/map/MapView.tsx`

- [x] Import `Source` from `react-map-gl` (already available)
- [x] Add a helper `buildGeofenceGeoJSON(lat, lng, radiusM)` that returns a GeoJSON Feature:
      — outer ring: a large bounding box covering the whole world
        `[[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]]`
      — inner ring (hole): an approximate circle polygon (64 points) at `(lat, lng)` with `radiusM`
      — result is a Polygon with a hole — the "world minus circle" shape
- [x] Inside `<Map>`, when `isRestrictedAccount(user?.university_id)`:
      - Render `<Source id="geofence" type="geojson" data={...}>`
      - With a `<Layer>` of type `fill`:
        `fill-color: '#ff0000'`, `fill-opacity: 0.18`
      - And a second `<Layer>` of type `line` at the circle boundary:
        `line-color: '#ff4444'`, `line-width: 1.5`, `line-dasharray: [3, 3]`, `line-opacity: 0.6`
- [x] The GeoJSON is computed once via `useMemo` (deps: university coords)
      — recomputes only if university changes (never in practice during a session)
- [x] Only render the overlay when NOT in 3D mode (pitch > 0 distorts fill layers visually)
      — use `is3D` state to conditionally render

---

### Phase 10C — Block pin placement at boundary (placement mode confirm) ✅
**File:** `frontend/src/components/map/MapView.tsx`

- [x] In the `onClick` intercept (placement mode + hoveredPlace confirmed):
      - Call `isWithinCampus(hoveredPlace.lat, hoveredPlace.lng, user?.university_id)`
      - If **outside**: do NOT open form — instead set a local `outOfBoundsToast` state
        (auto-clears after 2.5s), show a brief red banner:
        "📍 That location is outside your campus zone"
      - If **inside**: proceed normally (`setPinPlacementMode(false)` + `setCreatePinContext`)
- [x] Render the toast banner (absolute positioned, bottom of map, zIndex 600)

**Cursor tint during placement mode:**
- [x] In the `<Map onMouseMove>` handler, when `pinPlacementMode` and hoveredPlace resolved:
      - Check `isWithinCampus(hoveredPlace.lat, hoveredPlace.lng, user?.university_id)`
      - Store result in a local `hoverInBounds: boolean` state
- [x] The cursor overlay 📍 emoji div: tint red (`filter: 'hue-rotate(180deg)'`) when
      `pinPlacementMode && !hoverInBounds`
- [x] The orange preview `<Marker>` at hoveredPlace: swap orange for red when out of bounds

---

### Phase 10D — Block submission in CreatePinForm (double-gate, covers A4) ✅
**File:** `frontend/src/components/map/DetailPanel.tsx`

- [x] Import `isWithinCampus` and `isRestrictedAccount`
- [x] At the top of `CreatePinForm`, derive:
      ```ts
      const lat = lockedPlace?.lat ?? createPinContext?.mapCenter?.lat ?? 0
      const lng = lockedPlace?.lng ?? createPinContext?.mapCenter?.lng ?? 0
      const outOfBounds = isRestrictedAccount(user?.university_id ?? 'other')
        && !isWithinCampus(lat, lng, user?.university_id ?? 'other')
      ```
- [x] If `outOfBounds`:
      - Show a warning banner at the top of the form:
        "⚠️ This location is outside your campus zone. You can't post here."
      - Disable the "Post to Map" button in step 2 (`disabled={outOfBounds || ...}`)
      - Style: red-tinted banner, `background: 'rgba(220,30,30,0.15)'`,
        `border: '1px solid rgba(220,30,30,0.3)'`

---

### Phase 10E — Backend validation ✅

- [x] Firestore security rule added to `pins` create: `withinCampus(lat, lng, university_id)`
      using equirectangular Haversine approximation — deployed to buzzoncampus-f9257
- [x] Radius: 8047m (5 miles) for all universities — matches `universityCoords.ts`
- [ ] Ask **Tirsan** to add the same check in any Cloud Function that creates or modifies pins

---

---

## Phase 11 — Security Fixes (from adversarial audit) ✅

### CRITICAL
- [x] **university_id spoof bypass**: `firestore.rules` pin create rule now reads `university_id` from the caller's user doc via `get(/databases/.../users/$(request.auth.uid)).data.university_id` — payload value is ignored entirely.
- [x] **No input validation/XSS**: `CreatePinForm.handleSubmit` enforces title ≤ 100, description ≤ 500 (slice + `maxLength` attr). Character counter appears at 80%+ capacity.
- [x] **buzzCost no max**: `handleSubmit` validates `1 ≤ buzzCost ≤ 1000` before calling `createPin()`.

### HIGH
- [x] **pins.ts missing auth check**: `createPin()` now checks `getAuth().currentUser` at the top — throws before any Firestore call if unauthenticated.
- [x] **Race condition — map center**: `handleSubmit` now requires `lat`/`lng` to be non-undefined — if both `lockedPlace` and `mapCenter` are absent, shows error and blocks submit. The `?? 41.1006` hardcoded fallback is removed.

### MEDIUM
- [x] **Username lookup fragile**: `username` field added to `CreatePinInput` and `FirestorePin`. `handleSubmit` passes `(user as any).username ?? user.email ?? user.uid` — deleted accounts will show the username that was current at pin creation time, not the UID.
- [ ] **Client-side place distance filter**: `pinsHere` filtered on frontend — acceptable for hackathon, no fix needed.

### LOW
- [ ] **No rate limiting**: Cloud Function rate limit — Tirsan to add if needed post-hackathon.
- [x] **Universities collection world-readable**: changed to `allow read: if request.auth != null` — deployed.

### BONUS (discovered during implementation)
- [x] **admins collection had no Firestore rule**: `getAdminInfo()` in AdminPage was silently failing with permission-denied for all users. Added `allow read: if request.auth != null && request.auth.uid == userId` — AdminPage now works correctly.

---

## Notes
- Do NOT touch `firestore.rules` — Sumaiya owns that
- Do NOT touch `functions/` — Tirsan owns that
- If Firestore rules block writes, ask Sumaiya to allow authenticated pin creation

---

---

## Phase 11.5 — Seed Data & Dev Admin Accounts

### Goal
Populate Firestore with realistic demo data for all three universities so the app never
looks empty during a demo. Create dev admin accounts (`dev@domain`) for each university
that are pre-loaded into the `admins` collection. Test users have participations with
a mix of approved and pending volunteer hours so Phase 12–14 features have real data
to render against.

All seed data is written by a new script: `scripts/seed_demo_data.mjs`.
Dev users are written by an extension of `scripts/seed_test_users.mjs`.

---

### Adversarial Analysis

**A1 — Seed script run in production accidentally**
Script must check `process.env.NODE_ENV !== 'production'` OR require a `--confirm` flag
before writing. Default: dry-run prints what would be written without touching Firestore.

**A2 — Dev admin accounts used to approve real users' hours in production**
Dev accounts are real Auth users — if the app ever goes public, dev@ysu.edu could
approve/reject real volunteer hours.
Fix: seed script tags dev user docs with `is_dev: true`. Cloud Function and Firestore rule
for approval checks `is_dev != true` on the approver before allowing the action.
Alternative (simpler for hackathon): just delete dev accounts before going public.

**A3 — Test pins visible to real users**
Seed pins use `university_id` of real universities. Real users at Kent/YSU/OSU would
see fake seed pins on their map.
Fix: seed pins get `is_seed: true` field. Firestore query in `subscribeToPins` filters
`where('is_seed', '!=', true)` for non-dev accounts. Dev accounts see everything.
Note: this requires a composite index on `university_id + status + is_seed`.

**A4 — Seed participations with wrong user_ids**
If test user Auth accounts don't exist yet, seeding participations will have dangling
`user_id` references. Script must create users first, then pins, then participations
(strict order). Wrap all three stages in a top-level try/catch with rollback logging.

---

### Phase 11.5A — Admin Accounts ✅
**File:** `scripts/seed_admins.py` (new Python script — runs with venv + ADC)

Replaces the original plan of extending seed_test_users.mjs. Used Python Firebase Admin SDK
since ADC was available in the Python venv but not Node at the time.

Accounts created and live in Firebase:
- [x] `admin@ysu.edu` / `adminPassword` — writes `users/{uid}` + `admins/{uid}`, university_id: 'ysu'
- [x] `admin@kent.edu` / `adminPassword` — university_id: 'kent'
- [x] `admin@osu.edu` / `adminPassword` — university_id: 'osu'
- [x] `admin@gmail.com` / `adminPassword` — university_id: 'general' (super-admin, sees all)
- [x] All accounts: `email_verified: true`, `is_dev: true`, `buzz_balance: 0`

---

### Phase 11.5B — Demo Seed Pins
**File:** `scripts/seed_demo_data.mjs` (new script)

Script reads test user UIDs from Firestore (`users` where `is_dev != true`, ordered by email),
then writes pins owned by those users. Uses `is_seed: true` on each pin doc.

#### Youngstown State University (lat: 41.1006, lng: -80.6481)

| # | type | title | location | lat | lng | buzz | hours | owner |
|---|------|-------|----------|-----|-----|------|-------|-------|
| 1 | event | Penguin Pep Rally 🐧 | Stambaugh Stadium | 41.0993 | -80.6512 | 15 | — | test1@ysu.edu |
| 2 | volunteer | Campus Clean-Up Crew | Wick Ave Entrance | 41.1015 | -80.6462 | 20 | 2 hrs | test2@ysu.edu |
| 3 | help | Lost my Student ID near Kilcawley | Kilcawley Center | 41.1002 | -80.6488 | 5 | — | test1@ysu.edu |
| 4 | event | Salsa Night at Student Union | DeBartolo Stadium | 41.0998 | -80.6495 | 10 | — | test2@ysu.edu |
| 5 | volunteer | Food Bank Sorting Shift | Student Food Bank | 41.1008 | -80.6472 | 25 | 3 hrs | test1@ysu.edu |
| 6 | help | Need Calc 2 Tutor — Exam Next Week | Maag Library | 41.1012 | -80.6485 | 10 | — | test2@ysu.edu |
| 7 | event | Intramural Basketball Signups | WATTS Center | 41.1020 | -80.6470 | 8 | — | test1@ysu.edu |

#### Kent State University (lat: 41.1534, lng: -81.3579)

| # | type | title | location | lat | lng | buzz | hours | owner |
|---|------|-------|----------|-----|-----|------|-------|-------|
| 1 | event | Flash Mob at the Commons | The Commons | 41.1538 | -81.3592 | 12 | — | test1@kent.edu |
| 2 | volunteer | Habitat for Humanity Build Day | Risman Plaza | 41.1542 | -81.3565 | 30 | 4 hrs | test2@kent.edu |
| 3 | help | Ride to Downtown Kent Needed | Student Center | 41.1528 | -81.3580 | 8 | — | test1@kent.edu |
| 4 | event | Open Mic Night | Student Center Stage | 41.1530 | -81.3583 | 10 | — | test2@kent.edu |
| 5 | volunteer | Library Book Reshelving | Kent Library | 41.1545 | -81.3575 | 15 | 2 hrs | test1@kent.edu |
| 6 | help | Lost Umbrella — Black w/ White Dots | Tri-Towers | 41.1522 | -81.3588 | 5 | — | test2@kent.edu |
| 7 | event | Pickup Soccer — All Skill Levels | Dix Stadium Turf | 41.1515 | -81.3560 | 8 | — | test1@kent.edu |

#### Ohio State University (lat: 40.0067, lng: -83.0305)

| # | type | title | location | lat | lng | buzz | hours | owner |
|---|------|-------|----------|-----|-----|------|-------|-------|
| 1 | event | Buckeye Study Marathon | Thompson Library | 40.0072 | -83.0305 | 15 | — | test1@osu.edu |
| 2 | volunteer | RPAC Equipment Orientation Help | RPAC | 40.0050 | -83.0300 | 20 | 3 hrs | test2@osu.edu |
| 3 | help | Looking for Calc 3 Study Partner | Oval | 40.0062 | -83.0311 | 10 | — | test1@osu.edu |
| 4 | event | Mirror Lake BBQ & Hangout | Mirror Lake | 40.0045 | -83.0315 | 12 | — | test2@osu.edu |
| 5 | volunteer | Campus Food Pantry Shift | Ohio Union | 40.0063 | -83.0306 | 25 | 2 hrs | test1@osu.edu |
| 6 | help | Mac Charger Needed — In Sullivant | Sullivant Hall | 40.0060 | -83.0323 | 5 | — | test2@osu.edu |
| 7 | event | Improv Comedy Show | Mershon Auditorium | 40.0075 | -83.0294 | 10 | — | test1@osu.edu |

`event_date` for upcoming events: set to 2–7 days from seed time (`Date.now() + N * 86400000`).
Past events: set `event_date` to 3–10 days ago and `status: 'completed'`.

---

### Phase 11.5C — Demo Participations & Volunteer Hours
**File:** `scripts/seed_demo_data.mjs` (continued)

For each university, seed participations so test users have activity in their profile.
Pattern: test user 2 joins some of test user 1's pins, and vice versa.

#### Participation states per university (same pattern applied to all 3)

| pin | participant | status | hours | hours_status |
|-----|-------------|--------|-------|--------------|
| volunteer pin #1 (2 hrs) | other test user | completed | 2 | **approved** — dev admin wrote approval |
| volunteer pin #2 (3+ hrs) | other test user | completed | 3 | **pending** — awaiting admin review |
| event pin #1 | other test user | joined | — | — |
| event pin #2 | other test user | joined | — | — |
| help pin #1 | other test user | completed | — | — |

For the **approved** participation:
- Write `hours_status: 'approved'`, `reviewed_by: dev_admin_uid`, `reviewed_at: Timestamp`
- Increment `users/{participant_uid}.volunteer_hours_total` by hours value
  (script does this directly via Admin SDK — bypasses Cloud Function for seeding)

For the **pending** participation:
- Write `hours_status: 'pending'`, `reviewed_by: null`
- Do NOT increment `volunteer_hours_total`

For a **disputed** example (one per university):
- Take one rejected participation, set `hours_status: 'disputed'`,
  `dispute_reason: 'I definitely showed up — check the sign-in sheet'`,
  `dispute_count: 1`

---

### Phase 11.5D — Script safety & run instructions

- [ ] Script opens with: `if (!process.argv.includes('--confirm')) { console.log('Dry run...'); process.exit(0) }`
- [ ] All Firestore writes batched where possible (max 500 per batch)
- [ ] Each stage logs clearly: `✓ Created pin: [title]`, `✓ Created participation`, etc.
- [ ] Script is idempotent: pins written with a stable `seed_id` field;
      if a doc with that `seed_id` already exists, skip it (don't duplicate)
- [ ] Run order documented in script header:
      ```
      1. node scripts/seed_test_users.mjs       # creates users + dev admins
      2. node scripts/seed_demo_data.mjs --confirm  # creates pins + participations
      ```

---

---

## Phase 12 — Past & Upcoming Events (Profile)

### Goal
Add two sections to ProfilePage: **Upcoming** (future events the user has joined) and
**Past** (completed events/volunteer/help the user participated in).
Data comes from the `participations` collection, joined against `pins`.

---

### Adversarial Analysis

**A1 — Reading other users' participations**
Firestore `participations` query filters by `user_id == auth.uid` on the client.
A user could modify the query in DevTools to read another user's history.
⚠️ **Sumaiya must add a Firestore rule**: `participations` reads allowed only when
`request.auth.uid == resource.data.user_id`.

**A2 — Stale pin data**
Participations store `pin_id` not a snapshot of the pin. If a pin is deleted/cancelled,
the join query will return nothing for that pin_id — handle gracefully (skip that card).

**A3 — Infinite list abuse**
A user could have thousands of participations. Always paginate with `limit(20)` +
a "Load more" button. Never fetch all at once.

---

### Phase 12A — Firestore query helper in `api/` ✅
**File:** `frontend/src/api/participations.ts` (created)

- [x] `getUserPins(uid)` — query `pins` where `user_id == uid` (user's own posted pins)
- [x] `getUserParticipations(uid)` — query `participations` where `user_id == uid`
- [x] `Participation` type exported with `volunteer_hours` and `hours_status`

---

### Phase 12B — Upcoming & Past sections in ProfilePage ✅ (partial)
**File:** `frontend/src/pages/ProfilePage.tsx`

- [x] On mount: calls `getUserPins(user.uid)` — shows pins the user **posted**
      ⚠️ Note: original plan was to show pins they **participated in** — that's still pending
      (joinPin not wired yet, so no real participations exist to show)
- [x] Splits into upcoming (active + future event_date) and past (completed/cancelled or past date)
- [x] PinCard component with type badge, hours badge for volunteer, participant count + buzz
- [x] Loading state + empty state
- [x] "Pins Posted" stat reads real count; "Vol. Hours" reads `volunteer_hours_total` from user doc
- [ ] Show participated-in events (pending until joinPin is wired — Phase 12B remainder)
- [ ] Pending hours "X hrs pending" display below vol. hours stat (Phase 13D)

---

---

## Phase 13 — Volunteer Hours Tracking

### Goal
When creating a volunteer pin, the creator sets an expected volunteer hours value.
When the pin is completed, that hours value is recorded in the `participations` doc.
Total hours are shown on the user's profile. Admin approves before hours are "official"
(approval flow is Phase 14).

---

### Adversarial Analysis

**A1 — Client sets arbitrary hours**
Hours come from the create form — a user could DevTools the input to send `999`.
Mitigation: **validate on the Cloud Function** side: `1 <= volunteer_hours <= 12`.
Frontend enforces the same range, but backend is the gate.

**A2 — Hours double-counted**
If `completePin` is called twice (network retry, duplicate request), hours could be
awarded twice. Fix: Cloud Function must check `participation.status != 'completed'`
before writing — already part of atomic transaction, just make sure it's enforced.

**A3 — Non-volunteer pins with hours**
A user could POST a `help` pin with `volunteer_hours` set. The `createPin` function
must strip `volunteer_hours` from the payload if `type != 'volunteer'`.

**A4 — Hours shown before approval**
Display hours as "pending" until admin approves (Phase 14). Never add to the official
`volunteer_hours_total` on the user doc until approved.

---

### Phase 13A — Add `volunteer_hours` to pin schema ✅
**Files:** `frontend/src/api/pins.ts`

- [x] `volunteer_hours: number | null` added to `FirestorePin` interface
- [x] `volunteer_hours: number | null` added to `CreatePinInput` interface

---

### Phase 13B — Volunteer hours field in CreatePinForm ✅
**File:** `frontend/src/components/map/DetailPanel.tsx`

- [x] Number input shown when `type === 'volunteer'` (already existed in form)
- [x] `volunteer_hours` passed to `createPin()` in handleSubmit — `null` for non-volunteer types
- [ ] Input validation (1–12 range with error message) — currently uses `min={1}` HTML attr only

---

### Phase 13C — Store hours in participations on completion ⏳ (Tirsan)
**File:** `functions/src/pins/completePin.ts`

- [ ] When writing the participation doc on completion, include:
      `volunteer_hours: pin.volunteer_hours ?? null`
      `hours_status: pin.type === 'volunteer' ? 'pending' : null`
- [ ] Do NOT increment `volunteer_hours_total` here — that happens in `approveVolunteerHours`

---

### Phase 13D — Pending hours display in ProfilePage ⏳
**File:** `frontend/src/pages/ProfilePage.tsx`

- [x] "Vol. Hours" stat reads `volunteer_hours_total` from user doc (approved hours)
- [ ] Show pending hours count: query participations where `hours_status == 'pending'`, sum hours,
      display "X hrs pending" in amber below the stat card

---

---

## Phase 14 — Admin System + Volunteer Hours Approval

### Goal
Each `.edu` domain has one admin account (assigned manually by Tirsan in Firestore console).
A `general` admin exists for testing. Admins can view pending volunteer hour requests for
their university and approve or dispute them. Disputed requests can be contested by users.

---

### Adversarial Analysis

**A1 — Self-granting admin**
If `admins` collection is writable by authenticated users, anyone can make themselves admin.
⚠️ **Firestore rule**: `admins` collection is **read-only for all authenticated users**,
write only allowed via admin SDK (Tirsan runs bootstrap script once).
Alternative: write rule `allow write: if false` — all admin provisioning done via console/SDK.

**A2 — Cross-university approval**
An admin from `kent.edu` could approve hours for a `ysu.edu` user.
Fix: Cloud Function `approveVolunteerHours` checks
`adminDoc.university_id == participation.university_id` before writing.
General admin (`university_id: 'general'`) bypasses this check — only one such account.

**A3 — Admin approves own hours**
An admin is also a regular user and could participate in volunteer events.
Fix: Cloud Function checks `request.auth.uid != participation.user_id`.

**A4 — Replaying approval**
An approval request could be replayed to credit hours multiple times.
Fix: Cloud Function checks `participation.hours_status == 'pending'` before writing.
Set `hours_status: 'approved'` atomically in the same transaction.

**A5 — Dispute loop abuse**
A user disputes → admin re-reviews → user disputes again infinitely.
Fix: max 1 dispute per participation. After second admin decision, status is final.
Track `dispute_count: number` on the participation doc.

**A6 — Admin account takeover**
Admin account is compromised → attacker approves fake hours for accomplices.
Mitigation: admin accounts use same `.edu` email + OTP flow. No special bypass.
Future: require 2FA for admin accounts (post-hackathon).

---

### Phase 14A — Firestore schema + Cloud Function ✅
- [x] `admins/{uid}` collection live — seeded via `scripts/seed_admins.py`
- [x] `participations` schema includes `volunteer_hours`, `hours_status`, `dispute_count`, `dispute_reason`, `reviewed_by`, `reviewed_at`
- [x] `approveVolunteerHours` Cloud Function deployed — validates admin scope, enforces university match, atomically approves/rejects

---

### Phase 14B — Admin check helper ✅
**File:** `frontend/src/api/admin.ts` (created)

- [x] `getAdminInfo(uid)` — returns `AdminInfo | null` (includes `university_id` for scope)
- [x] `isAdmin(uid)` — deprecated wrapper kept for backwards compat
- [x] `getPendingHoursRequests(adminUniversityId)` — skips university filter when `'general'`; loads pin + username for each participation
- [x] `callApproveVolunteerHours(participationId, action)` — calls Cloud Function

---

### Phase 14C — Admin route in App ✅ (partial)
**File:** `frontend/src/App.tsx`

- [x] Route `/admin` added, guarded by `user` (same as other protected routes)
- [ ] `isAdmin` flag not stored in `useAuthStore` — AdminPage fetches admin status itself on mount
      (acceptable for now; if needed later, add to auth load in App.tsx useEffect)

---

### Phase 14D — AdminPage ✅
**File:** `frontend/src/pages/AdminPage.tsx` (created)

- [x] Scope card shows university name + description of what admin can approve
- [x] Super-admin (general) badge vs scoped badge
- [x] Pending requests list with approve/reject buttons, per-card loading state
- [x] University tag on each card when super-admin is viewing across universities
- [x] Empty state, access denied state, loading state
- [ ] "Disputed" tab (Phase 14E prerequisite — disputed participations don't exist yet)

---

### Phase 14E — Dispute flow for users ⏳
**File:** `frontend/src/pages/ProfilePage.tsx`

- [ ] In past pins section, if `participation.hours_status == 'rejected'` AND `dispute_count < 1`:
      show "Dispute" button → inline text input for reason → write `hours_status: 'disputed'`,
      `dispute_reason`, `dispute_count: 1` to Firestore
      ⚠️ Firestore rule needed: user can only update own participation when `hours_status == 'rejected'` AND `dispute_count < 1`
- [ ] This requires participation data to be loaded in ProfilePage (currently loads own pins only)

---

### Phase 14F — Admin link in Navbar ✅
**File:** `frontend/src/components/ui/Navbar.tsx`

- [x] "🛡️ Admin" added to avatar dropdown for all logged-in users
      Note: shows for everyone but AdminPage gates access — acceptable for hackathon
- [ ] Optionally hide link for non-admins (requires isAdmin in AuthStore)

---

---

## Phase 15 — Geofence Boundary in 3D Mode

### Goal
Currently the red fill overlay is hidden when `is3D` is true because fill layers
look wrong at pitch. The circle boundary line should still be visible in 3D mode
so users know their posting zone.

---

### Adversarial Analysis
No security surface — purely visual. No data writes involved.

---

### Phase 15A — Separate fill and line layer visibility ✅
**File:** `frontend/src/components/map/MapView.tsx`

- [x] `buildCircleLineGeoJSON(lat, lng, radiusM)` added — returns a GeoJSON `LineString` tracing
      just the campus circle (no world bounding box)
- [x] `circleLineGeoJSON` computed via `useMemo` alongside `geofenceGeoJSON`
- [x] 2D mode: existing world-minus-circle fill + border shown (`!is3D`)
- [x] 3D mode: separate `<Source id="geofence-circle">` with a `line` layer shown (`is3D`)
      — dashed red line, `line-width: 2`, `line-opacity: 0.8`

---

---

## Phase 16 — 3D Model Pins ⏳ (not started)

### Goal
Replace the current `red.glb` avatar marker with distinct per-type 3D models from
`/public/glb files/`. Each pin type maps to a different model. Models are large
(17–35 MB each) so need lazy loading and scale tuning.

Available models:
- `Alien.glb` (17 MB)
- `Caveman.glb` (19 MB)
- `Dinosaur.glb` (17 MB)
- `Podium.glb` (21 MB)
- `Cave with a car.glb` (34 MB)

---

### Adversarial Analysis

**A1 — Model path injection**
`avatar_model` field stored in Firestore pin doc is used as a file path for `useGLTF`.
An attacker could write an arbitrary path (e.g., `https://evil.com/payload.glb`).
Fix: **whitelist** allowed model paths in `AvatarMarker` — never pass `avatar_model`
directly to `useGLTF`. Map it through a lookup table:
```ts
const MODEL_MAP: Record<string, string> = {
  '/models/red.glb': '/red.glb',
  'Alien.glb': '/glb files/Alien.glb',
  // ...
}
const safePath = MODEL_MAP[avatar_model] ?? '/red.glb'
```

**A2 — DoS via large model spam**
A user posts 50 pins each with `Cave with a car.glb` (34 MB × 50 = 1.7 GB of downloads).
Fix: `useGLTF` caches by URL — each unique path loads once. Still, limit to 5 visible
3D model pins at a time: only render the closest N pins to map center as 3D; farther
pins fall back to a simple colored circle marker.

**A3 — Canvas-per-marker memory exhaustion**
Current `AvatarMarker` creates one `<Canvas>` (WebGL context) per pin.
Browsers limit WebGL contexts to ~16 per page — too many pins = blank/crash.
Fix: Render 3D models only for pins within a certain zoom/distance threshold.
Beyond that threshold, use a flat 2D `<div>` marker.

---

### Phase 16A — Model type mapping
**File:** `frontend/src/components/map/AvatarMarker.tsx`

- [ ] Add `MODEL_MAP` constant (whitelist):
      ```ts
      const MODEL_MAP: Record<string, string> = {
        event:     '/glb files/Alien.glb',
        volunteer: '/glb files/Caveman.glb',
        help:      '/glb files/Dinosaur.glb',
        business:  '/glb files/Podium.glb',
      }
      ```
- [ ] `AvatarMarker` receives `type` prop (already exists) — use `MODEL_MAP[type] ?? '/red.glb'`
      instead of hardcoded `'/red.glb'`
- [ ] Preload all 4 models via `useGLTF.preload()` at module level so they load in background

---

### Phase 16B — Scale and camera tuning per model
**File:** `frontend/src/components/map/AvatarMarker.tsx`

- [ ] Each model has different proportions — define per-model scale and camera position:
      ```ts
      const MODEL_CONFIG: Record<string, { scale: number; cameraPos: [number,number,number] }> = {
        event:     { scale: 0.8, cameraPos: [2, 2, 3] },
        volunteer: { scale: 1.0, cameraPos: [2, 2, 3] },
        help:      { scale: 0.9, cameraPos: [2, 2, 3] },
        business:  { scale: 0.7, cameraPos: [1.5, 2, 2.5] },
      }
      ```
- [ ] Pass `scale` and `cameraPos` through to `AvatarModel` and apply to `<primitive>`

---

### Phase 16C — WebGL context limit guard
**File:** `frontend/src/components/map/MapView.tsx`

- [ ] Track current map zoom in state
- [ ] Only render `<AvatarMarker>` (3D Canvas) for pins when `zoom >= 14`
- [ ] Below zoom 14: render a simple `<div>` circle with the pin's `user_color` instead
      — this prevents spawning dozens of WebGL contexts when zoomed out

---

### Phase 16D — Geofence border on 3D model
- [ ] `AvatarMarker` canvas already shows the model — the "border" from todo.txt means
      the ring/badge below the model should reflect the geofence color when out of bounds
- [ ] Add `outOfBounds?: boolean` prop to `AvatarMarker`
- [ ] When `outOfBounds`: badge background turns red (`#ff4444`)
- [ ] MapView computes this per-pin: `!isWithinCampus(pin.lat, pin.lng, user.university_id)`
      and passes it down
      — this is purely visual, no security implication

---
