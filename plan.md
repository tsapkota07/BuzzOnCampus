# BuzzOnCampus — Final 30-Min Launch Plan
# Owner: Tirsan
# Updated: 2026-03-29
# SUBMISSION MODE — only safe, fast, necessary steps. No new features.

---

## What's Done (do not redo)
- Auth flow (OTP, signup, login) ✅
- All 6 Cloud Functions deployed ✅
- Phase 13C: completePin writes participation docs ✅
- University ID mismatch fixed (youngstown→ysu, ohio→osu) ✅
- Admin accounts seeded, is_dev: False ✅
- Existing user docs patched (buzz_balance, university_id) ✅
- Frontend deployed → https://buzzoncampus-f9257.web.app ✅

---

## Step 1 — Seed demo pins (Tirsan) — 2 min
Run the seed script so the map isn't empty for real users:
```bash
python scripts/seed_demo_data.py
```
Currently has 23 pins. Good enough — do NOT wait to add more.

---

## Step 2 — Shafi: 3D models — (in parallel)
Shafi is updating per-type 3D GLB models on the map.
Do NOT deploy hosting until Shafi says his build is ready.
When he's done: `npm run build` in `frontend/`, then Tirsan runs:
```bash
firebase deploy --only hosting
```

---

## Step 3 — Final deploy (Tirsan) — 2 min
After Shafi's build is confirmed:
```bash
firebase deploy --only hosting
```
Functions and Firestore are already live — do NOT redeploy unless broken.

---

## Step 4 — Smoke test (everyone) — 5 min
Hit these on https://buzzoncampus-f9257.web.app — stop if anything is broken:
- [ ] Landing page loads, university selector changes colors
- [ ] Login with test1@ysu.edu / adminPassword works → red theme, pins on map
- [ ] Map shows demo pins (after seed script runs)
- [ ] 3D buildings toggle works
- [ ] Drop a Buzz → place a pin → pin appears on map
- [ ] Profile page shows correct university name + buzz balance
- [ ] Admin panel loads for admin@ysu.edu

---

## CANCELLED — not enough time, too risky
- seed_demo_data.py expansion to 25 pins each — 23 is fine
- joinPin() Cloud Function wiring — skip
- Dispute flow (Phase 14E) — skip
- Geofence boundary line in 3D — skip
- Per-type 3D model pin markers (Phase 16) — Shafi handles separately
- Any new Firestore rules changes — too risky to deploy right now

---

## Emergency contacts
- Firebase console: https://console.firebase.google.com/project/buzzoncampus-f9257
- Live app: https://buzzoncampus-f9257.web.app
- If map is blank: check Firestore indexes are deployed (`firebase deploy --only firestore:indexes`)
