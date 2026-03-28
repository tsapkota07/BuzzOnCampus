import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const MAX_ATTEMPTS = 3

// Callable — verifies a 6-digit OTP for a given email
// Call from frontend: httpsCallable(functions, 'verifyOtp')({ email, code })
// Returns { verified: true } on success — frontend then calls createUserWithEmailAndPassword
export const verifyOtp = onCall(async (request) => {
  const { email, code } = request.data as { email: string; code: string }

  if (!email || !code) {
    throw new HttpsError('invalid-argument', 'Email and code are required.')
  }

  const ref = db.collection('otps').doc(email)
  const snap = await ref.get()

  if (!snap.exists) {
    throw new HttpsError('not-found', 'No verification code found. Please request a new one.')
  }

  const data = snap.data()!
  const now = Date.now()

  if (now > data.expires_at) {
    await ref.delete()
    throw new HttpsError('deadline-exceeded', 'Code has expired. Please request a new one.')
  }

  if (data.attempts >= MAX_ATTEMPTS) {
    await ref.delete()
    throw new HttpsError('resource-exhausted', 'Too many attempts. Please request a new code.')
  }

  if (data.code !== code) {
    await ref.update({ attempts: admin.firestore.FieldValue.increment(1) })
    const remaining = MAX_ATTEMPTS - (data.attempts + 1)
    throw new HttpsError('invalid-argument', `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`)
  }

  // Code is correct — delete the OTP doc
  await ref.delete()

  return { verified: true }
})
