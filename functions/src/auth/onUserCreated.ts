import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

// When a user doc is created in Firestore, award 20 Buzz Points
// The user doc is created by Sumaiya's AuthContext after signup
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId
  await db.collection('users').doc(userId).update({
    buzz_balance: 20,
  })
})
