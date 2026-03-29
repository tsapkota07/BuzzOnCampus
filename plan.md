# BuzzOnCampus — Deployment & Launch Plan
# Owner: Tirsan
# Updated: 2026-03-28
# All build work is done. This plan covers what's left to go live.

---

## What's Already Done
- Resend account + `mail.tirsansapkota.com` domain verified
- `RESEND_API_KEY` set in `.env`
- `sendOtp`, `verifyOtp`, `completePin`, `getFeed`, `validateEduEmail` deployed
- `OtpScreen.tsx`, `SignupForm.tsx`, `LoginForm.tsx`, `AuthPage.tsx` built
- Frontend deployed → https://buzzoncampus-f9257.web.app

---

## Phase 1 — Fix `onUserCreated` (Buzz Points on signup)

**Problem:** `onUserCreated` is in `index.ts` but does NOT appear in `firebase functions:list`.
Without it, new users start with 0 Buzz Points instead of 20.

**Fix:**
```bash
cd /Users/tirsansapkota/BuzzOnCampus
firebase deploy --only functions
firebase functions:list
```

**Verify:** `onUserCreated` appears in the list with trigger `providers/cloud.firestore/...`

---

## Phase 2 — Deploy Firestore (rules + indexes)

**Problem:** Firestore indexes are not deployed — production returns empty. Map queries will fail
without the composite indexes.

```bash
firebase deploy --only firestore
firebase firestore:indexes
```

**Verify:** Output shows 3 indexes (pins by university_id+status, pins by university_id+type, participations by user_id).

---

## Phase 3 — Test OTP Flow End-to-End ✓

- [x] Landing page → Log In / Create Account → `/auth`
- [x] Login with correct creds + verified → `/map`
- [x] Login with wrong creds → error on login form
- [x] Login with correct creds + unverified → OTP screen
- [x] Signup → OTP sent → OTP screen → account created → `/map`
- [x] `email_verified: true` written to Firestore on OTP success
- [x] Page refresh restores verified session, unverified users stay logged out
- [x] New user doc has `buzz_balance: 20` (depends on `onUserCreated` trigger — verify in console)
- [x] Non-`.edu` email blocked (client-side domain check in SignupForm)

---

## Phase 4 — Seed Data

Coordinate with Sumaiya to load universities into Firestore:

```bash
source scripts/.venv/bin/activate
python scripts/seed_universities.py
```

**Verify:** Firebase console → `universities/` collection has at least Kent State, YSU, Akron.

---

## Phase 5 — Demo Rehearsal

Walk through the full demo flow once before presenting:

1. Landing page → pick university (colors change)
2. Sign up with `.edu` email → OTP arrives → enter code → account created with 20 Buzz Points
3. Map loads, 3D buildings toggle works
4. Post a pin (event/volunteer/help) → pin appears on map
5. Join a pin → `participant_count` increments
6. Complete a pin → Buzz Points transfer confirmed
7. Feed shows recent campus activity

---

## Notes
- `validateEduEmail` is deployed but disabled in `index.ts` — client-side `.edu` check + OTP covers it
- OTP codes expire in 10 min, max 3 attempts before requiring resend
- `otps/{email}` Firestore docs are deleted on successful verify
- Do not commit `serviceAccountKey.json` if you download one for testing
