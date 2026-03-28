# BuzzOnCampus — OTP Email Verification Plan
# Owner: Tirsan
# Goal: Send a 6-digit OTP to the user's .edu email before account creation.

---

## Overview of the full flow once built

```
User fills SignupForm → clicks "Create Account"
  → frontend calls sendOtp({ email })
  → Cloud Function generates 6-digit code
  → stores in Firestore: otps/{email} { code, expires_at, attempts: 0 }
  → sends email via Resend API
  → frontend shows OtpScreen (enter your code)

User enters 6-digit code → clicks "Verify"
  → frontend calls verifyOtp({ email, code })
  → Cloud Function checks code + expiry + attempts (max 3)
  → if valid: deletes OTP doc, returns { ok: true }
  → frontend proceeds with Firebase createUserWithEmailAndPassword
  → user is created, Firestore user doc written, redirected to /map
```

---

## Step 1 — Create a Resend account

1. Go to https://resend.com and sign up (free)
2. After login, go to **API Keys** → click **Create API Key**
3. Name it `buzzoncampus`, permission: **Sending access**
4. Copy the key — you will only see it once. Save it somewhere safe.

---

## Step 2 — Add your domain to Resend

1. In Resend dashboard → **Domains** → **Add Domain**
2. Enter: `mail.tirsansapkota.com`
   - This is a subdomain — it will NOT affect your existing website
3. Resend will show you DNS records to add (3–4 records: TXT for SPF, CNAME for DKIM, optionally TXT for DMARC)

---

## Step 3 — Add DNS records to tirsansapkota.com

1. Log in to wherever your domain DNS is managed (Namecheap, Cloudflare, GoDaddy, etc.)
2. Add **only** the records Resend gives you — do not touch anything already there
3. All records will be on `mail.tirsansapkota.com` (the subdomain), not the root domain
4. Go back to Resend → **Domains** → click **Verify DNS Records**
5. Status should turn green (can take a few minutes to propagate)

> After this step emails will go out as:
> `From: BuzzOnCampus <noreply@mail.tirsansapkota.com>`

---

## Step 4 — Add Resend API key to Cloud Functions environment

```bash
# From the repo root
cd functions
firebase functions:secrets:set RESEND_API_KEY
# Paste your Resend API key when prompted
```

This stores it securely in Google Secret Manager — never hardcoded.

---

## Step 5 — Install Resend SDK in functions

```bash
cd functions
npm install resend
npm run build   # make sure it still compiles
```

---

## Step 6 — Tell Claude to build the Cloud Functions

Once Steps 1–5 are done, tell Claude:
> "Resend is set up, API key is stored as RESEND_API_KEY secret. Build sendOtp and verifyOtp."

Claude will build:
- `functions/src/auth/sendOtp.ts` — generates code, stores in Firestore, sends email
- `functions/src/auth/verifyOtp.ts` — validates code, handles expiry + attempts
- Export both from `functions/src/index.ts`
- Add `otps/{email}` collection to root CLAUDE.md

---

## Step 7 — Tell Claude to build the OTP screen on the frontend

Claude will build:
- `src/components/auth/OtpScreen.tsx` — 6-digit input, resend button, 10-min countdown
- Wire it into `AuthPage.tsx` — shows after signup form is submitted, before Firebase account creation

---

## Step 8 — Deploy the new functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

Verify in Firebase Console → Functions that `sendOtp` and `verifyOtp` appear.

---

## Step 9 — Test end-to-end

Test each of these cases manually:

- [ ] Valid .edu email → OTP email arrives in inbox (check spam too)
- [ ] Enter correct OTP → account created, redirected to /map
- [ ] Enter wrong OTP → error shown, attempt count increments
- [ ] Enter wrong OTP 3 times → locked out, must request new code
- [ ] Wait 10 minutes → OTP expired, must request new code
- [ ] Click "Resend Code" → new OTP sent, old one invalidated
- [ ] Non-.edu email → blocked at Cloud Function level (validateEduEmail still runs)

---

## Step 10 — Update CLAUDE.md

After everything works, update the checkboxes in root `CLAUDE.md`:
- [ ] `validateEduEmail` deployed
- [ ] `sendOtp` deployed
- [ ] `verifyOtp` deployed
- [ ] OTP screen built
- [ ] End-to-end auth tested

---

## What you need before Claude can write any code

| Requirement | Status |
|---|---|
| Resend account created | [ ] |
| `mail.tirsansapkota.com` verified in Resend | [ ] |
| `RESEND_API_KEY` secret set in Firebase | [ ] |
| `npm install resend` done in `functions/` | [ ] |

Come back to Claude once all four are checked off.

---

## Notes

- The `validateEduEmail` blocking function (already written) stays. It runs at the Firebase level
  and blocks non-.edu emails before OTP is even attempted. OTP is a second layer on top.
- OTP codes expire in **10 minutes**, max **3 attempts** before requiring a resend.
- The `otps` Firestore collection stores codes temporarily — documents are deleted on successful verify.
- Do not commit the Resend API key to git. It must live in Firebase Secret Manager only.
