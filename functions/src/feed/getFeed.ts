import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

// Returns recent activity for a university feed
// Call from frontend: httpsCallable(functions, 'getFeed')({ universityId })
export const getFeed = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in.')

  const { universityId } = request.data as { universityId: string }

  const snapshot = await db.collection('pins')
    .where('university_id', '==', universityId)
    .orderBy('created_at', 'desc')
    .limit(30)
    .get()

  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  return { items }
})
