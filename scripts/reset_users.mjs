// Deletes all Firebase Auth users and their Firestore user docs.
// Run from repo root: node scripts/reset_users.mjs
//
// Requires GOOGLE_APPLICATION_CREDENTIALS env var OR running with firebase-admin
// auto-discovery via Application Default Credentials.
// Easiest: run `firebase login` first, then this script uses the same credentials.

import { initializeApp, cert } from '../functions/node_modules/firebase-admin/lib/app/index.js'
import { getAuth } from '../functions/node_modules/firebase-admin/lib/auth/index.js'
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/firestore/index.js'

const app = initializeApp({ projectId: 'buzzoncampus-f9257' })
const auth = getAuth(app)
const db = getFirestore(app)

async function deleteAllUsers() {
  let deleted = 0
  let pageToken

  do {
    const result = await auth.listUsers(1000, pageToken)
    const uids = result.users.map(u => u.uid)

    if (uids.length > 0) {
      await auth.deleteUsers(uids)
      deleted += uids.length
      console.log(`Deleted ${uids.length} auth users`)
    }

    pageToken = result.pageToken
  } while (pageToken)

  console.log(`Total auth users deleted: ${deleted}`)
}

async function deleteAllUserDocs() {
  const snap = await db.collection('users').get()
  const batch = db.batch()
  snap.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
  console.log(`Deleted ${snap.size} Firestore user docs`)
}

async function main() {
  console.log('Resetting all users...')
  await deleteAllUsers()
  await deleteAllUserDocs()
  console.log('Done. All users cleared.')
}

main().catch(console.error)
