import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

// Callable function — admin approves or rejects pending volunteer hours.
// Scoping rules:
//   university_id 'general' → super-admin, may act on any university's participations
//   any other university_id → scoped admin, may only act on their own university's pins
//
// Call from frontend: httpsCallable(functions, 'approveVolunteerHours')({ participationId, action })
export const approveVolunteerHours = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in.')

  const { participationId, action } = request.data as {
    participationId: string
    action: 'approve' | 'reject'
  }

  if (!['approve', 'reject'].includes(action)) {
    throw new HttpsError('invalid-argument', 'action must be "approve" or "reject".')
  }

  // Verify caller is an admin and get their university scope
  const adminDoc = await db.collection('admins').doc(request.auth.uid).get()
  if (!adminDoc.exists) throw new HttpsError('permission-denied', 'Not an admin.')
  const adminData = adminDoc.data()!
  const adminUniversity: string = adminData.university_id

  // Load the participation
  const participationRef = db.collection('participations').doc(participationId)
  const participation = await participationRef.get()
  if (!participation.exists) throw new HttpsError('not-found', 'Participation not found.')

  const data = participation.data()!
  if (data.hours_status !== 'pending') {
    throw new HttpsError('failed-precondition', 'This participation is not pending review.')
  }

  // Enforce university scope — load the pin to check its university_id
  if (adminUniversity !== 'general') {
    const pinDoc = await db.collection('pins').doc(data.pin_id).get()
    if (!pinDoc.exists) throw new HttpsError('not-found', 'Associated pin not found.')
    const pinUniversity: string = pinDoc.data()!.university_id
    if (pinUniversity !== adminUniversity) {
      throw new HttpsError(
        'permission-denied',
        `You can only review participations for ${adminUniversity}.`
      )
    }
  }

  if (action === 'approve') {
    await db.runTransaction(async (tx) => {
      const userRef = db.collection('users').doc(data.user_id)
      tx.update(participationRef, {
        hours_status: 'approved',
        reviewed_by: request.auth!.uid,
        reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
      })
      tx.update(userRef, {
        volunteer_hours_total: admin.firestore.FieldValue.increment(data.volunteer_hours ?? 0),
      })
    })
  } else {
    await participationRef.update({
      hours_status: 'rejected',
      reviewed_by: request.auth.uid,
      reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  return { success: true }
})
