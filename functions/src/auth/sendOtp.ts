import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { Resend } from 'resend'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const ALLOWED_DOMAINS = ['kent.edu', 'osu.edu', 'ysu.edu', 'gmail.com'] // TODO: remove gmail.com before final demo
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

function isValidUniversityEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ALLOWED_DOMAINS.some(base => domain === base || domain.endsWith(`.${base}`))
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Callable — sends a 6-digit OTP to the provided .edu email
// Call from frontend: httpsCallable(functions, 'sendOtp')({ email })
export const sendOtp = onCall(async (request) => {
  const { email } = request.data as { email: string }

  if (!email || !isValidUniversityEmail(email)) {
    throw new HttpsError('invalid-argument', 'Must be a valid university email address.')
  }

  const code = generateOtp()
  const expiresAt = Date.now() + OTP_EXPIRY_MS

  // Store OTP in Firestore — keyed by email, overrides any previous code
  await db.collection('otps').doc(email).set({
    code,
    expires_at: expiresAt,
    attempts: 0,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Send email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'BuzzOnCampus <noreply@mail.tirsansapkota.com>',
    to: email,
    subject: 'Your BuzzOnCampus verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #452800; margin-bottom: 8px;">
          BuzzOnCampus
        </h2>
        <p style="color: #5c5b5b; margin-bottom: 24px;">
          Use the code below to verify your university email. It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background: #fff5ed; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #fd8b00;">
            ${code}
          </span>
        </div>
        <p style="color: #5c5b5b; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new HttpsError('internal', 'Failed to send verification email.')
  }

  return { sent: true }
})
