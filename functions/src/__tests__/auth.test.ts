import { HttpsError } from 'firebase-functions/v2/https'

// --- isValidUniversityEmail (mirrored from sendOtp.ts) ---
const ALLOWED_DOMAINS = ['kent.edu', 'osu.edu', 'ysu.edu', 'gmail.com']

function isValidUniversityEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ALLOWED_DOMAINS.some(base => domain === base || domain.endsWith(`.${base}`))
}

// --- generateOtp (mirrored from sendOtp.ts) ---
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// --- verifyOtp logic (extracted for unit testing) ---
const MAX_ATTEMPTS = 3

function verifyOtpLogic(
  otpData: { code: string; expires_at: number; attempts: number } | null,
  inputCode: string,
  now: number
): { verified: true } {
  if (!otpData) throw new HttpsError('not-found', 'No verification code found.')

  if (now > otpData.expires_at) {
    throw new HttpsError('deadline-exceeded', 'Code has expired.')
  }

  if (otpData.attempts >= MAX_ATTEMPTS) {
    throw new HttpsError('resource-exhausted', 'Too many attempts.')
  }

  if (otpData.code !== inputCode) {
    const remaining = MAX_ATTEMPTS - (otpData.attempts + 1)
    throw new HttpsError('invalid-argument', `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`)
  }

  return { verified: true }
}

// -------------------------------------------------------

describe('isValidUniversityEmail', () => {
  it('accepts exact allowed domains', () => {
    expect(isValidUniversityEmail('user@kent.edu')).toBe(true)
    expect(isValidUniversityEmail('user@osu.edu')).toBe(true)
    expect(isValidUniversityEmail('user@ysu.edu')).toBe(true)
  })

  it('accepts subdomains of allowed domains', () => {
    expect(isValidUniversityEmail('user@student.kent.edu')).toBe(true)
    expect(isValidUniversityEmail('user@mail.osu.edu')).toBe(true)
  })

  it('rejects unlisted domains', () => {
    expect(isValidUniversityEmail('user@harvard.edu')).toBe(false)
    expect(isValidUniversityEmail('user@mit.edu')).toBe(false)
  })

  it('rejects empty or malformed emails', () => {
    expect(isValidUniversityEmail('')).toBe(false)
    expect(isValidUniversityEmail('notanemail')).toBe(false)
  })

  it('is case-insensitive on domain', () => {
    expect(isValidUniversityEmail('user@KENT.EDU')).toBe(true)
  })
})

describe('generateOtp', () => {
  it('generates a 6-digit string', () => {
    const otp = generateOtp()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('generates values between 100000 and 999999', () => {
    for (let i = 0; i < 50; i++) {
      const n = parseInt(generateOtp(), 10)
      expect(n).toBeGreaterThanOrEqual(100000)
      expect(n).toBeLessThanOrEqual(999999)
    }
  })
})

describe('verifyOtpLogic', () => {
  const baseOtp = { code: '123456', expires_at: Date.now() + 60000, attempts: 0 }

  it('returns verified on correct code', () => {
    expect(verifyOtpLogic(baseOtp, '123456', Date.now())).toEqual({ verified: true })
  })

  it('throws not-found when OTP doc is missing', () => {
    expect(() => verifyOtpLogic(null, '123456', Date.now()))
      .toThrow(expect.objectContaining({ code: 'not-found' }))
  })

  it('throws deadline-exceeded when expired', () => {
    const expired = { ...baseOtp, expires_at: Date.now() - 1000 }
    expect(() => verifyOtpLogic(expired, '123456', Date.now()))
      .toThrow(expect.objectContaining({ code: 'deadline-exceeded' }))
  })

  it('throws resource-exhausted after max attempts', () => {
    const maxed = { ...baseOtp, attempts: 3 }
    expect(() => verifyOtpLogic(maxed, 'wrong', Date.now()))
      .toThrow(expect.objectContaining({ code: 'resource-exhausted' }))
  })

  it('throws invalid-argument on wrong code and shows remaining attempts', () => {
    const oneAttemptUsed = { ...baseOtp, attempts: 1 }
    expect(() => verifyOtpLogic(oneAttemptUsed, 'wrong', Date.now()))
      .toThrow(expect.objectContaining({ code: 'invalid-argument', message: expect.stringContaining('1 attempt') }))
  })

  it('does not allow code reuse after max attempts even with correct code', () => {
    const maxed = { ...baseOtp, attempts: 3 }
    expect(() => verifyOtpLogic(maxed, '123456', Date.now()))
      .toThrow(expect.objectContaining({ code: 'resource-exhausted' }))
  })
})
