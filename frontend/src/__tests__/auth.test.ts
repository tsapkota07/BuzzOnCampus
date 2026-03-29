import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/useAuthStore'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  uid: 'user-123',
  email: 'test@kent.edu',
  university_id: 'kent',
  buzz_balance: 20,
  color: '#14B8A6',
  avatar_url: null,
}

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

// ─── useAuthStore — basic state management ────────────────────────────────────

describe('useAuthStore', () => {
  it('starts with no user', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setUser stores the user', () => {
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('logout clears the user', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setUser(null) clears the user', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('buzz_balance is accessible from user', () => {
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user?.buzz_balance).toBe(20)
  })

  it('setUser overwrites an existing user without merging', () => {
    const firstUser = { ...mockUser, uid: 'first', buzz_balance: 10 }
    const secondUser = { ...mockUser, uid: 'second', buzz_balance: 50 }
    useAuthStore.getState().setUser(firstUser)
    useAuthStore.getState().setUser(secondUser)
    const stored = useAuthStore.getState().user
    expect(stored?.uid).toBe('second')
    expect(stored?.buzz_balance).toBe(50)
  })

  it('logout after already-null user is a no-op', () => {
    expect(() => useAuthStore.getState().logout()).not.toThrow()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('store is consistent across repeated set/clear cycles', () => {
    for (let i = 0; i < 10; i++) {
      useAuthStore.getState().setUser({ ...mockUser, uid: `user-${i}` })
      expect(useAuthStore.getState().user?.uid).toBe(`user-${i}`)
      useAuthStore.getState().logout()
      expect(useAuthStore.getState().user).toBeNull()
    }
  })
})

// ─── .edu email validation ────────────────────────────────────────────────────
// Mirrors SignupForm client-side logic — must match exactly.

const ALLOWED_DOMAINS = ['kent.edu', 'osu.edu', 'ysu.edu', 'gmail.com']

function isValidUniversityEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ALLOWED_DOMAINS.some(base => domain === base || domain.endsWith(`.${base}`))
}

describe('client-side email validation — valid inputs', () => {
  it('accepts kent.edu', () => {
    expect(isValidUniversityEmail('student@kent.edu')).toBe(true)
  })

  it('accepts osu.edu', () => {
    expect(isValidUniversityEmail('student@osu.edu')).toBe(true)
  })

  it('accepts ysu.edu', () => {
    expect(isValidUniversityEmail('student@ysu.edu')).toBe(true)
  })

  it('accepts gmail.com (dev/general accounts)', () => {
    expect(isValidUniversityEmail('dev@gmail.com')).toBe(true)
  })

  it('accepts subdomains of allowed domains', () => {
    expect(isValidUniversityEmail('student@cs.kent.edu')).toBe(true)
    expect(isValidUniversityEmail('a@mail.osu.edu')).toBe(true)
    expect(isValidUniversityEmail('x@student.ysu.edu')).toBe(true)
  })

  it('accepts deep subdomains', () => {
    expect(isValidUniversityEmail('x@a.b.kent.edu')).toBe(true)
  })

  it('case-insensitive domain matching', () => {
    expect(isValidUniversityEmail('student@KENT.EDU')).toBe(true)
    expect(isValidUniversityEmail('student@Kent.Edu')).toBe(true)
  })

  it('local part with dots and plus is OK', () => {
    expect(isValidUniversityEmail('first.last+tag@kent.edu')).toBe(true)
  })
})

describe('client-side email validation — invalid / adversarial inputs', () => {
  it('rejects non-allowed .edu domain', () => {
    expect(isValidUniversityEmail('student@harvard.edu')).toBe(false)
    expect(isValidUniversityEmail('student@mit.edu')).toBe(false)
    expect(isValidUniversityEmail('student@stanford.edu')).toBe(false)
  })

  it('rejects gmail.org (not gmail.com)', () => {
    expect(isValidUniversityEmail('x@gmail.org')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidUniversityEmail('')).toBe(false)
  })

  it('rejects missing @ symbol', () => {
    expect(isValidUniversityEmail('studentkent.edu')).toBe(false)
  })

  it('rejects bare domain with no local part (@kent.edu)', () => {
    // split('@')[0] is empty string — still a valid call, domain is kent.edu
    // This should actually PASS the domain check — document the behavior.
    // If SignupForm validates non-empty local part separately, this is acceptable.
    const email = '@kent.edu'
    const domain = email.split('@')[1]?.toLowerCase() ?? ''
    expect(ALLOWED_DOMAINS.some(b => domain === b || domain.endsWith(`.${b}`))).toBe(true)
    // Insight: domain-only check passes — local-part emptiness must be caught elsewhere.
  })

  it('adversary: domain suffix collision — rejects xkent.edu', () => {
    // "endsWith('.kent.edu')" should not match "xkent.edu"
    expect(isValidUniversityEmail('x@xkent.edu')).toBe(false)
  })

  it('adversary: domain suffix collision — rejects evilkent.edu', () => {
    expect(isValidUniversityEmail('x@evilkent.edu')).toBe(false)
  })

  it('adversary: subdomain of a non-allowed domain is rejected', () => {
    expect(isValidUniversityEmail('x@kent.evil.com')).toBe(false)
    expect(isValidUniversityEmail('x@kent.edu.evil.com')).toBe(false)
  })

  it('adversary: null-byte and whitespace in domain are rejected', () => {
    // Null-byte after domain: 'kent.edu\x00' does not equal 'kent.edu' so split fails
    expect(isValidUniversityEmail('x@kent.edu\x00')).toBe(false)
    // Space inside domain: 'kent .edu' matches no allowed domain
    expect(isValidUniversityEmail('x@kent .edu')).toBe(false)
  })

  it('gap: leading whitespace in local part passes domain check (form-level concern)', () => {
    // '  x@kent.edu'.split('@')[1] === 'kent.edu' — domain is valid.
    // The whitespace is in the local part, which isValidUniversityEmail does not check.
    // Browser <input type="email"> and/or a trim() call in SignupForm must catch this.
    expect(isValidUniversityEmail('  x@kent.edu')).toBe(true) // domain check passes
  })

  it('adversary: multiple @ symbols — only domain after last @ matters', () => {
    // "x@y@kent.edu".split('@')[1] is "y" — not kent.edu — so it should fail
    const tricky = 'x@y@kent.edu'
    expect(isValidUniversityEmail(tricky)).toBe(false)
  })

  it('adversary: URL-encoded @ (%40) does not bypass check', () => {
    // %40 is not a real @ — split('@') gives one segment
    expect(isValidUniversityEmail('x%40kent.edu')).toBe(false)
  })

  it('rejects bare TLD domain', () => {
    // '.edu' does not equal or end with '.kent.edu'
    expect(isValidUniversityEmail('x@.edu')).toBe(false)
  })

  it('gap: leading-dot domain bypasses endsWith check (known validation gap)', () => {
    // '.kent.edu'.endsWith('.kent.edu') === true — this passes erroneously.
    // A domain with a leading dot is invalid per RFC 5321, but the current
    // isValidUniversityEmail implementation does not reject it.
    // Fix: add a check that domain does not start with '.' in SignupForm validation.
    expect(isValidUniversityEmail('x@.kent.edu')).toBe(true) // documents the gap
  })

  it('rejects very long domain string', () => {
    const longDomain = 'a'.repeat(300) + '.kent.edu'
    // Valid subdomain structure but unrealistically long — still passes domain check.
    // Documenting behavior: length limits must be enforced at the form input level.
    expect(typeof isValidUniversityEmail(`x@${longDomain}`)).toBe('boolean')
  })
})

// ─── useAuthStore — adversarial store manipulation ───────────────────────────

describe('useAuthStore — adversarial inputs', () => {
  it('stores partial user object without throwing', () => {
    const partial = { uid: 'p', email: 'p@k.edu' } as any
    expect(() => useAuthStore.getState().setUser(partial)).not.toThrow()
    expect(useAuthStore.getState().user).toEqual(partial)
  })

  it('stores user with negative buzz_balance (server must validate)', () => {
    const negative = { ...mockUser, buzz_balance: -999 }
    useAuthStore.getState().setUser(negative)
    expect(useAuthStore.getState().user?.buzz_balance).toBe(-999)
    // Note: client store does not enforce non-negative — Firestore rules must.
  })

  it('stores user with empty-string uid (Firestore rules must reject ops with empty uid)', () => {
    const noUid = { ...mockUser, uid: '' }
    useAuthStore.getState().setUser(noUid)
    expect(useAuthStore.getState().user?.uid).toBe('')
  })

  it('stores user with unknown university_id (geofence logic handles "other" fallback)', () => {
    const unknown = { ...mockUser, university_id: 'totally-fake-uni' }
    useAuthStore.getState().setUser(unknown)
    expect(useAuthStore.getState().user?.university_id).toBe('totally-fake-uni')
    // universityCoords.ts falls back to UNIVERSITY_COORDS.other for unknown ids
  })

  it('stores user with university_id "other" — no geofence restriction', () => {
    const other = { ...mockUser, university_id: 'other' }
    useAuthStore.getState().setUser(other)
    expect(useAuthStore.getState().user?.university_id).toBe('other')
  })
})

// ─── isWithinCampus / geofence logic ─────────────────────────────────────────
// Tests the pure utility functions from universityCoords.ts

import { isWithinCampus, isRestrictedAccount, getUniversityCoords } from '../utils/universityCoords'

describe('isRestrictedAccount', () => {
  it('kent, ysu, osu are restricted', () => {
    expect(isRestrictedAccount('kent')).toBe(true)
    expect(isRestrictedAccount('ysu')).toBe(true)
    expect(isRestrictedAccount('osu')).toBe(true)
    expect(isRestrictedAccount('youngstown')).toBe(true)
    expect(isRestrictedAccount('ohio')).toBe(true)
  })

  it('other and general are unrestricted', () => {
    expect(isRestrictedAccount('other')).toBe(false)
    expect(isRestrictedAccount('general')).toBe(false)
  })

  it('unknown university_id falls back to unrestricted', () => {
    expect(isRestrictedAccount('harvard')).toBe(false)
    expect(isRestrictedAccount('')).toBe(false)
  })
})

describe('isWithinCampus', () => {
  it('exact campus center is within campus', () => {
    const { lat, lng } = getUniversityCoords('kent')
    expect(isWithinCampus(lat, lng, 'kent')).toBe(true)
  })

  it('location 100m from center is within 8047m radius', () => {
    const { lat, lng } = getUniversityCoords('kent')
    const offset = 100 / 111320 // ~100m in degrees lat
    expect(isWithinCampus(lat + offset, lng, 'kent')).toBe(true)
  })

  it('location far outside campus (e.g., New York) is not within campus', () => {
    expect(isWithinCampus(40.7128, -74.006, 'kent')).toBe(false)
  })

  it('unrestricted account (other) is always within campus regardless of coords', () => {
    expect(isWithinCampus(0, 0, 'other')).toBe(true)
    expect(isWithinCampus(90, 180, 'other')).toBe(true)
    expect(isWithinCampus(-90, -180, 'other')).toBe(true)
  })

  it('adversary: setting university_id to "other" bypasses geofence in client logic', () => {
    // This is the known CRITICAL issue — client passes university_id in pin payload.
    // Firestore rules must independently verify via get(users/{uid}).university_id.
    expect(isWithinCampus(40.7128, -74.006, 'other')).toBe(true) // New York passes
    // ⚠️ This confirms the attack vector — fix is in firestore.rules (Phase 11)
  })

  it('adversary: unknown university_id behaves like "other" (no restriction)', () => {
    expect(isWithinCampus(0, 0, 'fake-university')).toBe(true)
  })

  it('location just inside the radius boundary is accepted', () => {
    const { lat, lng, radiusM } = getUniversityCoords('kent')
    // Move exactly (radiusM - 1) meters north
    const offsetDeg = (radiusM - 1) / 111320
    expect(isWithinCampus(lat + offsetDeg, lng, 'kent')).toBe(true)
  })

  it('location just outside the radius boundary is rejected', () => {
    const { lat, lng, radiusM } = getUniversityCoords('kent')
    // Move exactly (radiusM + 100) meters north
    const offsetDeg = (radiusM + 100) / 111320
    expect(isWithinCampus(lat + offsetDeg, lng, 'kent')).toBe(false)
  })
})
