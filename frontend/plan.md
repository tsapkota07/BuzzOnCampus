# Post a Pin → Live on Map — Implementation Plan

## Context
Firebase is live (project: buzzoncampus-f9257). Auth, Firestore, and Cloud Functions are
all connected. The goal is: user fills PostPinModal → pin writes to Firestore → appears
live on the map for everyone via onSnapshot.

Firestore pin schema:
  user_id, user_color, type, title, description, buzz_reward,
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

## Phase 9 — Upcoming Events Panel ⏳ TODO — will be built inside the List View instead

### Phase 9A
- [ ] `upcomingOpen: boolean` + `setUpcomingOpen` in MapStore

### Phase 9B
- [ ] "Upcoming 📅" pill button in Navbar, highlights when open

### Phase 9C — UpcomingPanel component
- [ ] Left-side panel, slides in from left
- [ ] Filters livePins to future event_date, sorted ascending
- [ ] Each card: date badge, type badge, title, buzz reward, participant count
- [ ] Click card → `setSelectedPin(pin)` + close panel

### Phase 9D
- [ ] Mount `<UpcomingPanel />` in MapPage

---

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

## Phase 11 — Security Fixes (from adversarial audit)

### CRITICAL
- [ ] **university_id spoof bypass**: Firestore rule trusts `request.resource.data.university_id` from payload. Attacker calls `useAuthStore.setState(s => ({ user: { ...s.user, university_id: 'other' } }))` from console → geofence defeated entirely. Fix: rule must read user doc (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.university_id`) instead of trusting payload.
- [ ] **No input validation/XSS**: title/description have no length limits, rendered directly. Fix: max title=100, desc=500 chars in CreatePinForm handleSubmit.
- [ ] **buzzCost no max**: HTML `min={1}` bypassable via DevTools. Fix: validate `1 <= buzzCost <= 1000` in handleSubmit before createPin call.

### HIGH
- [ ] **pins.ts missing auth check**: `createPin()` calls `addDoc()` without verifying `auth.currentUser`. Fix: add `if (!getAuth().currentUser) throw new Error('Not authenticated')` at top of createPin.
- [ ] **Race condition — map center**: if `lockedPlace` is null, pin coords default to `mapCenter` which can change. Fix: require `lockedPlace` to be set before allowing submit.

### MEDIUM
- [ ] **Username lookup fragile**: pins store `user_id` not `username`; if account deleted, UID shows instead. Fix: cache `username` string into pin doc at createPin time.
- [ ] **Client-side place distance filter**: `pinsHere` filtered on frontend — console can inject fake pins. Low priority for hackathon.

### LOW
- [ ] **No rate limiting**: user can spam createPin. Fix: Cloud Function rate limit (Tirsan).
- [ ] **Universities collection world-readable**: change rule to `request.auth != null`.

---

## Notes
- Do NOT touch `firestore.rules` — Sumaiya owns that
- Do NOT touch `functions/` — Tirsan owns that
- If Firestore rules block writes, ask Sumaiya to allow authenticated pin creation
