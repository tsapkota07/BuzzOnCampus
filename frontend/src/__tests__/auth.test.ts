import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/useAuthStore'

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
})

// --- .edu email validation (mirrored from SignupForm client-side logic) ---
const ALLOWED_DOMAINS = ['kent.edu', 'osu.edu', 'ysu.edu', 'gmail.com']

function isValidUniversityEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ALLOWED_DOMAINS.some(base => domain === base || domain.endsWith(`.${base}`))
}

describe('client-side email validation', () => {
  it('accepts valid university emails', () => {
    expect(isValidUniversityEmail('student@kent.edu')).toBe(true)
    expect(isValidUniversityEmail('student@osu.edu')).toBe(true)
  })

  it('accepts subdomains', () => {
    expect(isValidUniversityEmail('student@cs.kent.edu')).toBe(true)
  })

  it('rejects non-allowed domains', () => {
    expect(isValidUniversityEmail('student@harvard.edu')).toBe(false)
    expect(isValidUniversityEmail('student@gmail.org')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidUniversityEmail('')).toBe(false)
  })
})
