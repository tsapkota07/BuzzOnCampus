// Creates test Firebase Auth users + Firestore user docs for local/dev testing.
// Run from repo root: node scripts/seed_test_users.mjs
//
// Requires Application Default Credentials — run `firebase login` first.

import { initializeApp } from '../functions/node_modules/firebase-admin/lib/app/index.js'
import { getAuth } from '../functions/node_modules/firebase-admin/lib/auth/index.js'
import { getFirestore, Timestamp } from '../functions/node_modules/firebase-admin/lib/firestore/index.js'

const app = initializeApp({ projectId: 'buzzoncampus-f9257' })
const auth = getAuth(app)
const db = getFirestore(app)

const TEST_PASSWORD = 'password'

const TEST_USERS = [
  // YSU
  { email: 'test1@ysu.edu',   username: 'test1_ysu',  university_id: 'ysu',   color: '#CC0000' },
  { email: 'test2@ysu.edu',   username: 'test2_ysu',  university_id: 'ysu',   color: '#FF6666' },
  // Kent
  { email: 'test1@kent.edu',  username: 'test1_kent', university_id: 'kent',  color: '#002664' },
  { email: 'test2@kent.edu',  username: 'test2_kent', university_id: 'kent',  color: '#4466AA' },
  // OSU
  { email: 'test1@osu.edu',   username: 'test1_osu',  university_id: 'osu',   color: '#BB0000' },
  { email: 'test2@osu.edu',   username: 'test2_osu',  university_id: 'osu',   color: '#DD4444' },
  // Gmail (general)
  { email: 'test@gmail.com',  username: 'test_user',  university_id: 'other', color: '#1985a1' },
]

async function seedUsers() {
  for (const u of TEST_USERS) {
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: u.email,
        password: TEST_PASSWORD,
        displayName: u.username,
      })

      // Create Firestore user doc
      await db.collection('users').doc(userRecord.uid).set({
        email: u.email,
        username: u.username,
        university_id: u.university_id,
        buzz_balance: 20,
        color: u.color,
        avatar_url: null,
        email_verified: true,
        created_at: Timestamp.now(),
      })

      console.log(`✓ Created ${u.email}`)
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        console.log(`⚠  Skipped ${u.email} — already exists`)
      } else {
        console.error(`✗ Failed ${u.email}:`, err.message)
      }
    }
  }

  console.log(`\nAll test users processed.`)
  console.log(`Password for all: ${TEST_PASSWORD}`)
}

seedUsers().catch(console.error)
