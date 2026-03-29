import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

// Callable function — triggered when a pin is marked complete
// Atomically: transfers Buzz Points, updates pin status, logs transaction
// Call from frontend: httpsCallable(functions, 'completePin')({ pinId })
export const completePin = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in.')

  const { pinId } = request.data as { pinId: string }
  const callerId = request.auth.uid

  await db.runTransaction(async (tx) => {
    const pinRef = db.collection('pins').doc(pinId)
    const pin = await tx.get(pinRef)

    if (!pin.exists) throw new HttpsError('not-found', 'Pin not found.')
    const pinData = pin.data()!

    if (pinData.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Pin is not active.')
    }

    // Determine who gets the Buzz Points
    // volunteer/event: participant earns points
    // help: pin creator pays points to the helper
    const receiverId = pinData.type === 'help' ? callerId : callerId
    const senderId = pinData.type === 'help' ? pinData.user_id : null
    const amount: number = pinData.buzz_reward

    // Deduct from sender (help type only)
    if (senderId) {
      const senderRef = db.collection('users').doc(senderId)
      const sender = await tx.get(senderRef)
      const currentBalance: number = sender.data()?.buzz_balance ?? 0
      if (currentBalance < amount) {
        throw new HttpsError('failed-precondition', 'Insufficient Buzz Points.')
      }
      tx.update(senderRef, { buzz_balance: currentBalance - amount })
    }

    // Add to receiver
    const receiverRef = db.collection('users').doc(receiverId)
    const receiver = await tx.get(receiverRef)
    const receiverBalance: number = receiver.data()?.buzz_balance ?? 0
    tx.update(receiverRef, { buzz_balance: receiverBalance + amount })

    // Update pin status
    tx.update(pinRef, { status: 'completed' })

    // Log transaction
    const txRef = db.collection('transactions').doc()
    tx.set(txRef, {
      from_user_id: senderId ?? 'system',
      to_user_id: receiverId,
      amount,
      pin_id: pinId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Write participation doc (volunteer pins only include hours for admin approval)
    const participationRef = db.collection('participations').doc()
    tx.set(participationRef, {
      pin_id: pinId,
      user_id: callerId,
      status: 'completed',
      joined_at: admin.firestore.FieldValue.serverTimestamp(),
      volunteer_hours: pinData.type === 'volunteer' ? (pinData.volunteer_hours ?? null) : null,
      hours_status: pinData.type === 'volunteer' ? 'pending' : null,
      dispute_reason: null,
      dispute_count: 0,
      reviewed_by: null,
      reviewed_at: null,
    })
  })

  return { success: true }
})
