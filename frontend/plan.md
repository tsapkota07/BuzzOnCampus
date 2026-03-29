# Mapbox POI Click System — Implementation Plan

## Overview
Enable users to click any business/building label on the Mapbox dark map to open the PlaceDetailPanel. No manual seeding — Mapbox's built-in `poi-label` layer provides all place data.

---

## Phase 1 — POI Cursor (hover feedback)
**File:** `frontend/src/components/map/MapView.tsx`

- [x] Add `onLoad` callback to the `<Map>` component
- [x] Inside `onLoad`, get raw map instance via `mapRef.current.getMap()`
- [x] Add `mouseenter` on `poi-label` → set cursor to `pointer`
- [x] Add `mouseleave` on `poi-label` → reset cursor to `''`

**Test:** Hover over a restaurant or building label on the dark map — cursor should change to a pointer hand.

---

## Phase 2 — POI Click Handler + Category Mapping
**File:** `frontend/src/components/map/MapView.tsx`

- [x] Add `mapboxCategoryToOurs()` helper function that maps Mapbox category strings to our enum: `restaurant | cafe | bar | gym | library | university | retail | general`
- [x] Add `onClick` handler on the `<Map>` component
- [x] Inside handler: call `map.queryRenderedFeatures(e.point, { layers: ['poi-label'] })`
- [x] If no features → do nothing
- [x] If features found → extract `name`, `category_en`, `coordinates` from feature
- [x] Pass category through `mapboxCategoryToOurs()`

**Test:** Click a POI label and `console.log` the extracted name + mapped category.

---

## Phase 3 — Mock Place Creation + Open Detail Panel
**File:** `frontend/src/components/map/MapView.tsx`

- [x] After extracting POI data, build a mock place object
- [x] Call `setSelectedPlace(mockPlace)` from `useMapStore` → opens DetailPanel
- [x] Add TODO comment: `"TODO: Replace with POST /places/find-or-create"`

**Test:** Click a POI label → PlaceDetailPanel slides open with the place name and empty posts.

---

## Phase 4 — Empty State in DetailPanel
**File:** `frontend/src/components/map/DetailPanel.tsx`

- [x] When `selectedPlace.posts.length === 0`, show empty state instead of post list:
  - 📭 emoji centered
  - "No buzz here yet" bold white text
  - "Be the first to post something!" gray subtext
- [x] Keep the "+ POST HERE" button visible at the bottom

**Test:** Click any POI → panel opens → empty state shows correctly.

---

## Phase 5 — Remove Static Place Markers
**File:** `frontend/src/components/map/MapView.tsx`

- [x] Remove `mockPlaces` import and the `visiblePlaces` variable
- [x] Remove the place marker `<Marker>` block from the map JSX
- [x] Keep `mockUserPins` markers (event, volunteer, help) untouched
- [x] Clean up any unused `PlaceMarker` import if no longer needed

**Test:** Map loads with no static purple place squares. User pins still visible. Clicking a Mapbox POI label still opens the panel.

---

## Backend (Tirsan — after frontend is done)
- [ ] `POST /places/find-or-create` — find or insert place by name + coordinates
- [ ] `GET /places/{id}/posts` — return active posts for a place
- [ ] Frontend: replace mock in Phase 3 with real API call
- [ ] Frontend: replace `posts: []` with result from `GET /places/{id}/posts`
