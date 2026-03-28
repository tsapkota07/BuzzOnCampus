# Functions CLAUDE.md — Tirsan's Zone
# Primary owner: Tirsan | Read root CLAUDE.md first.

## Your Ownership
You own everything in `functions/`. No one else edits this folder.
You also own `firebase.json` and `firestore.indexes.json`.

## Your Files
```
functions/src/
  index.ts                      ← exports all functions (already scaffolded)
  auth/
    validateEduEmail.ts         ← blocks non-.edu signups (already written)
    onUserCreated.ts            ← awards 20 Buzz Points on user creation (already written)
  pins/
    completePin.ts              ← atomic Buzz transfer + pin completion (already written)
  feed/
    getFeed.ts                  ← returns recent pins for university feed (already written)
```

## Getting Started
```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools
firebase login

# Install function dependencies
cd functions
npm install

# Build TypeScript
npm run build

# Deploy all functions
firebase deploy --only functions

# Or run locally with emulator
firebase emulators:start --only functions,firestore,auth
```

## What's Already Built
The four core functions are scaffolded and working. Your job is to:
1. Deploy them and confirm they work
2. Test `completePin` end-to-end with real Firestore data
3. Fix any bugs that come up during testing
4. Add `cancelPin` if time allows (updates pin status to 'cancelled')

## Adding a New Function
1. Create a file in the appropriate `src/` subfolder
2. Export it from `src/index.ts`
3. Run `npm run build` and `firebase deploy --only functions`

## completePin Logic (understand this well)
The Buzz Points transfer is atomic via `db.runTransaction()`:
- **volunteer/event pin:** the participant (caller) earns `buzz_reward` points
- **help pin:** the pin creator pays `buzz_reward` points to the helper (caller)
- On any error (insufficient balance, pin already completed): transaction rolls back, nothing changes
- After success: pin.status = 'completed', transaction record created

## Firestore Indexes
If you add new queries with multiple `where()` + `orderBy()`, add the composite index to
`firestore.indexes.json` and run `firebase deploy --only firestore:indexes`.
The three indexes already in the file cover the core queries.

## Deployment Checklist
- [ ] `firebase login` and project set to `buzzoncampus` in `.firebaserc`
- [ ] `cd functions && npm install && npm run build`
- [ ] `firebase deploy --only functions`
- [ ] `firebase deploy --only firestore` (deploys rules + indexes)
- [ ] Test `validateEduEmail` — try registering with a non-.edu email, confirm it's blocked
- [ ] Test `completePin` — post a pin, complete it, check Buzz balance updated in Firestore
- [ ] `firebase deploy --only hosting` after Shafi builds the frontend

## Do Not
- Do not touch `frontend/` or `scripts/` or `firestore.rules`
- Do not change Firestore field names without telling Sumaiya (her API layer reads them)
- Do not add new callable functions without updating root `CLAUDE.md` contracts section
