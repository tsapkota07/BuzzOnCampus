# Functions CLAUDE.md — Tirsan's Zone
# Primary owner: Tirsan | Read root CLAUDE.md first.
# Last updated: sendOtp + verifyOtp built, Blaze plan needed before deploy.

## What You Own
- `functions/` — entirely yours, no one else edits
- `firebase.json` — Firebase service config
- `firestore.indexes.json` — composite query indexes
- `.firebaserc` — project ID (update this first)

## Current Status
Update these as you go. Claude reads this to know what's deployed.

### Setup
- [x] Functions project scaffolded (`package.json`, `tsconfig.json`)
- [x] `src/index.ts` — exports all functions
- [x] Firebase project created — `buzzoncampus-f9257`
- [x] `.firebaserc` updated with real project ID
- [x] `firebase login` done
- [x] `cd functions && npm install` done
- [x] `npm run build` passes with no errors

### Functions
- [x] `validateEduEmail` — written (blocks non-.edu signup)
- [x] `onUserCreated` — written (awards 20 Buzz Points)
- [x] `completePin` — written (atomic Buzz transfer)
- [x] `getFeed` — written (returns recent pins)
- [x] `sendOtp` — written (generates 6-digit OTP, stores in Firestore, emails via Resend)
- [x] `verifyOtp` — written (validates code, handles expiry + max 3 attempts)
- [x] `sendOtp`, `verifyOtp`, `completePin`, `getFeed`, `validateEduEmail` deployed
- [ ] `onUserCreated` NOT showing in deployed functions — needs recheck/redeploy
- [ ] `sendOtp` tested end-to-end
- [ ] `verifyOtp` tested end-to-end

### Firestore
- [ ] `firebase deploy --only firestore` done — indexes NOT deployed (production returns empty)
- [ ] Seed data loaded (Sumaiya runs the scripts — confirm with her)

### Hosting
- [x] `firebase deploy --only hosting` done — live at https://buzzoncampus-f9257.web.app

## Getting Started
```bash
# One-time setup
npm install -g firebase-tools
firebase login

# Update .firebaserc with your real project ID
# (open .firebaserc, change "buzzoncampus" to your actual Firebase project ID)

# Install and build
cd functions
npm install
npm run build        # must pass before deploying

# Deploy functions only
firebase deploy --only functions

# Deploy everything
firebase deploy

# Run locally (useful for testing before deploy)
firebase emulators:start --only functions,firestore,auth
```

## What's Already Written — Read Before Touching

### `src/auth/validateEduEmail.ts`
Firebase Auth trigger that runs before every new user is created.
Throws an error (which Firebase surfaces as a registration failure) if email doesn't end in `.edu`.
No changes needed unless you want to restrict to specific universities by domain.

### `src/auth/onUserCreated.ts`
Firestore trigger that fires when a new document is created in `users/{userId}`.
Updates `buzz_balance` to 20. Sumaiya's `AuthContext` creates the user doc — this fires automatically after.

### `src/pins/completePin.ts`
Callable function — the most important one. Atomic Firestore transaction:
- Validates caller is authenticated and pin is still active
- **volunteer/event pin:** caller (participant) receives `buzz_reward` points
- **help pin:** pin creator pays `buzz_reward` points to the caller (helper)
- Updates `pin.status` to `'completed'`
- Writes a `transactions` document for the audit log
- Rolls back everything if any step fails (e.g. insufficient balance)

### `src/feed/getFeed.ts`
Callable function — queries `pins` collection filtered by `university_id`, ordered by `created_at` desc, limit 30.
Returns `{ items: pin[] }`.

## Adding a New Function
1. Create `src/<category>/<functionName>.ts`
2. Export it from `src/index.ts`
3. Run `npm run build`
4. Run `firebase deploy --only functions`
5. Add it to the **Cloud Functions Reference** table in root `CLAUDE.md`

## Fixing the `joinPin` participant_count (Sumaiya needs this)
The `participant_count` field needs `FieldValue.increment(1)` — not a plain update.
Tell Sumaiya to use this in `frontend/src/api/pins.ts`:
```ts
import { increment, updateDoc, doc } from 'firebase/firestore'
await updateDoc(doc(db, 'pins', pinId), { participant_count: increment(1) })
```
This is a Firestore atomic increment — safe for concurrent joins.

## Firestore Indexes
Current indexes in `firestore.indexes.json` cover:
1. `pins` by `university_id` + `status` + `created_at` — used by map onSnapshot
2. `pins` by `university_id` + `type` + `status` — used by category filtering
3. `participations` by `user_id` + `joined_at` — used by profile page

If you add a new query with multiple `where()` + `orderBy()` fields, add the index:
```bash
firebase deploy --only firestore:indexes
```

## Deployment Order
Do these in order — each step depends on the previous:
1. `firebase deploy --only firestore` — rules + indexes must be live before frontend can read/write
2. `firebase deploy --only functions` — functions must be live before auth flow works
3. Tell Sumaiya functions are deployed so she can test auth
4. Tell Shafi the project ID and config so he can fill `.env`
5. `firebase deploy --only hosting` — last, after Shafi runs `npm run build`

## Do Not
- Do not touch `frontend/`, `firestore.rules`, or `scripts/`
- Do not rename Firestore field names — Sumaiya's API layer and seed scripts use them
- Do not add callable functions without documenting them in root `CLAUDE.md`
- Do not commit `serviceAccountKey.json` if you download one for testing

## How to Keep This File Current
Tick off checkboxes in **Current Status** as each step is completed.
If a function's behavior changes, update the description in **What's Already Written**.
