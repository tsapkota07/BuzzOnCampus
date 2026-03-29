// Creates admin Firebase Auth accounts + Firestore user + admin docs.
// Run from repo root: node scripts/seed_admins.mjs
//
// Requires Application Default Credentials — run `firebase login` first,
// then: GOOGLE_APPLICATION_CREDENTIALS=<path/to/key.json> node scripts/seed_admins.mjs
// OR: firebase use buzzoncampus-f9257 && node scripts/seed_admins.mjs

import { initializeApp } from '../functions/node_modules/firebase-admin/lib/app/index.js'
import { getAuth } from '../functions/node_modules/firebase-admin/lib/auth/index.js'
import { getFirestore, Timestamp } from '../functions/node_modules/firebase-admin/lib/firestore/index.js'

const app = initializeApp({ projectId: 'buzzoncampus-f9257' })
const auth = getAuth(app)
const db = getFirestore(app)

const ADMIN_PASSWORD = 'adminPassword'

// university_id: 'general' = super-admin (sees + approves all universities)
// university_id: 'ysu'|'kent'|'osu' = scoped admin (their university only)
const ADMINS = [
  {
    email: 'admin@ysu.edu',
    username: 'admin_ysu',
    university_id: 'ysu',
    color: '#CC0000',
  },
  {
    email: 'admin@kent.edu',
    username: 'admin_kent',
    university_id: 'kent',
    color: '#002664',
  },
  {
    email: 'admin@osu.edu',
    username: 'admin_osu',
    university_id: 'osu',
    color: '#BB0000',
  },
  {
    email: 'admin@gmail.com',
    username: 'super_admin',
    university_id: 'general',  // sees all universities
    color: '#7C3AED',
  },
]

async function seedAdmins() {
  console.log('Seeding admin accounts...\n')

  for (const a of ADMINS) {
    try {
      // 1 — Create (or find existing) Firebase Auth account
      let uid
      try {
        const existing = await auth.getUserByEmail(a.email)
        uid = existing.uid
        console.log(`  (already exists) ${a.email} → uid: ${uid}`)
      } catch {
        const record = await auth.createUser({
          email: a.email,
          password: ADMIN_PASSWORD,
          displayName: a.username,
        })
        uid = record.uid
        console.log(`  ✓ Created auth  ${a.email} → uid: ${uid}`)
      }

      // 2 — Write Firestore user doc (allows login via LoginForm)
      await db.collection('users').doc(uid).set({
        email: a.email,
        username: a.username,
        university_id: a.university_id,
        buzz_balance: 0,
        volunteer_hours_total: 0,
        color: a.color,
        avatar_url: null,
        email_verified: true,   // skip OTP — admin accounts are pre-verified
        is_dev: true,
        created_at: Timestamp.now(),
      }, { merge: true })

      // 3 — Write Firestore admin doc
      await db.collection('admins').doc(uid).set({
        email: a.email,
        university_id: a.university_id,
        is_dev: true,
        created_at: Timestamp.now(),
      }, { merge: true })

      console.log(`  ✓ Firestore docs written for ${a.email}`)
    } catch (err) {
      console.error(`  ✗ Failed ${a.email}:`, err.message)
    }

    console.log()
  }

  console.log('Done.')
  console.log(`Password for all admin accounts: ${ADMIN_PASSWORD}`)
  console.log()
  console.log('Accounts created:')
  for (const a of ADMINS) {
    const scope = a.university_id === 'general' ? 'ALL universities (super-admin)' : `${a.university_id.toUpperCase()} only`
    console.log(`  ${a.email.padEnd(22)}  scope: ${scope}`)
  }
}

seedAdmins().catch(console.error)
