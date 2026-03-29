import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// ─── Mirrors App.tsx routing exactly ─────────────────────────────────────────
// Must be kept in sync with App.tsx when routes are added/changed.

function GuardedApp({ authReady }: { authReady: boolean }) {
  const { user } = useAuthStore()
  if (!authReady) return <div data-testid="loading">loading</div>
  return (
    <Routes>
      <Route path="/"        element={user ? <Navigate to="/map" replace /> : <div data-testid="landing">landing</div>} />
      <Route path="/auth"    element={user ? <Navigate to="/map" replace /> : <div data-testid="auth">auth</div>} />
      <Route path="/map"     element={user ? <div data-testid="map">map</div>     : <Navigate to="/" replace />} />
      <Route path="/profile" element={user ? <div data-testid="profile">profile</div> : <Navigate to="/" replace />} />
      <Route path="/feed"    element={user ? <div data-testid="feed">feed</div>   : <Navigate to="/" replace />} />
      <Route path="/admin"   element={user ? <div data-testid="admin">admin</div> : <Navigate to="/" replace />} />
      <Route path="*"        element={<div data-testid="not-found">not-found</div>} />
    </Routes>
  )
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FULL_USER = {
  uid: 'user-123',
  email: 'test@kent.edu',
  university_id: 'kent',
  buzz_balance: 20,
  color: '#14B8A6',
  avatar_url: null,
}

const OTHER_USER = { ...FULL_USER, uid: 'other-789', email: 'dev@gmail.com', university_id: 'other' }

// ─── Protected routes list ─────────────────────────────────────────────────────
const PROTECTED = ['/map', '/profile', '/feed', '/admin'] as const
// ─── Public (auth-only-when-logged-out) routes ────────────────────────────────
const AUTH_ONLY_ANON = ['/', '/auth'] as const

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

afterEach(() => {
  useAuthStore.setState({ user: null })
})

// ─── Unauthenticated: protected routes must redirect ─────────────────────────

describe('Unauthenticated user — all protected routes redirect to /', () => {
  for (const path of PROTECTED) {
    it(`${path} → redirects to landing`, async () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={true} />
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByTestId('landing')).toBeTruthy()
        expect(screen.queryByTestId(path.replace('/', ''))).toBeNull()
      })
    })
  }
})

// ─── Authenticated: protected routes must be accessible ──────────────────────

describe('Authenticated user — all protected routes render', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: FULL_USER })
  })

  for (const path of PROTECTED) {
    it(`${path} → renders page`, async () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={true} />
        </MemoryRouter>
      )
      const pageId = path.replace('/', '')
      await waitFor(() => {
        expect(screen.getByTestId(pageId)).toBeTruthy()
      })
    })
  }
})

// ─── Authenticated: public routes redirect away ───────────────────────────────

describe('Authenticated user — public routes redirect to /map', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: FULL_USER })
  })

  for (const path of AUTH_ONLY_ANON) {
    it(`${path} → redirects to /map`, async () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={true} />
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByTestId('map')).toBeTruthy()
        expect(screen.queryByTestId('landing')).toBeNull()
        expect(screen.queryByTestId('auth')).toBeNull()
      })
    })
  }
})

// ─── Loading / race condition ─────────────────────────────────────────────────

describe('Auth not ready (race condition) — all protected routes show loading', () => {
  for (const path of PROTECTED) {
    it(`${path} is blocked by loading gate`, () => {
      useAuthStore.setState({ user: FULL_USER }) // user exists but auth not ready
      render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={false} />
        </MemoryRouter>
      )
      expect(screen.getByTestId('loading')).toBeTruthy()
      expect(screen.queryByTestId(path.replace('/', ''))).toBeNull()
    })
  }

  it('loading gate lifts when authReady becomes true', async () => {
    useAuthStore.setState({ user: FULL_USER })
    const { rerender } = render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={false} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('loading')).toBeTruthy()

    rerender(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeTruthy()
      expect(screen.queryByTestId('loading')).toBeNull()
    })
  })
})

// ─── 404 / wildcard — accessible regardless of auth state ─────────────────────

describe('404 route', () => {
  it('shows not-found for unknown route when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/totally-unknown-path']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('not-found')).toBeTruthy()
  })

  it('shows not-found for unknown route when authenticated', () => {
    useAuthStore.setState({ user: FULL_USER })
    render(
      <MemoryRouter initialEntries={['/totally-unknown-path']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('not-found')).toBeTruthy()
  })

  it('shows not-found even during loading gate', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <GuardedApp authReady={false} />
      </MemoryRouter>
    )
    // loading gate takes priority — not-found is behind authReady check
    expect(screen.getByTestId('loading')).toBeTruthy()
  })
})

// ─── Adversary: auth store poisoning ─────────────────────────────────────────

describe('Adversary — store poisoning attempts', () => {
  it('partial user object (missing buzz_balance) is still truthy — grants access', async () => {
    // A partially constructed user still allows navigation; missing fields are
    // handled per-page, not by the route guard.
    const partial = { uid: 'atk-1', email: 'x@kent.edu', university_id: 'kent', color: '#fff', avatar_url: null } as any
    useAuthStore.setState({ user: partial })
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy())
  })

  it('null user does not grant access regardless of how store is set', async () => {
    useAuthStore.setState({ user: null })
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByTestId('landing')).toBeTruthy())
  })

  it('user object with empty uid is still truthy — route guard passes', async () => {
    // The route guard only checks truthiness; empty-uid sessions are caught by
    // Firestore rules and Cloud Functions, not client-side routing.
    const emptyUid = { ...FULL_USER, uid: '' }
    useAuthStore.setState({ user: emptyUid })
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy())
  })

  it('user with university_id "other" can access all protected routes', async () => {
    useAuthStore.setState({ user: OTHER_USER })
    for (const path of PROTECTED) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={true} />
        </MemoryRouter>
      )
      const pageId = path.replace('/', '')
      await waitFor(() => expect(screen.getByTestId(pageId)).toBeTruthy())
      unmount()
    }
  })
})

// ─── Adversary: logout during navigation ─────────────────────────────────────

describe('Adversary — logout during navigation', () => {
  it('protected page becomes inaccessible after logout', async () => {
    useAuthStore.setState({ user: FULL_USER })
    const { rerender } = render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('map')).toBeTruthy()

    act(() => {
      useAuthStore.getState().logout()
    })

    rerender(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('landing')).toBeTruthy()
      expect(screen.queryByTestId('map')).toBeNull()
    })
  })

  it('login after logout restores protected route access', async () => {
    // Start logged out
    const { rerender } = render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('landing')).toBeTruthy()

    // Log in
    act(() => {
      useAuthStore.getState().setUser(FULL_USER)
    })

    rerender(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeTruthy()
    })
  })
})

// ─── Adversary: university-id spoofing in auth store ─────────────────────────

describe('Adversary — university_id spoofing in client store', () => {
  it('"other" university_id still lets user navigate everywhere', async () => {
    // Attacker sets university_id to "other" to bypass geofence.
    // Route guard must NOT use university_id — only truthiness of user.
    // The geofence is enforced by Firestore rules, not by routing.
    useAuthStore.setState({ user: OTHER_USER })
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy())
  })

  it('swapping university_id mid-session does not change routing access', async () => {
    useAuthStore.setState({ user: FULL_USER })
    const { rerender } = render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('map')).toBeTruthy()

    // Attacker mutates university_id in store
    act(() => {
      useAuthStore.setState({ user: { ...FULL_USER, university_id: 'other' } })
    })

    rerender(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedApp authReady={true} />
      </MemoryRouter>
    )
    // Still on map — routing is not affected by university_id change
    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy())
  })
})

// ─── Cross-university access ─────────────────────────────────────────────────

describe('Cross-university navigation consistency', () => {
  const universities = [
    { id: 'kent', email: 'test@kent.edu' },
    { id: 'ysu',  email: 'test@ysu.edu'  },
    { id: 'osu',  email: 'test@osu.edu'  },
    { id: 'other', email: 'dev@gmail.com' },
  ]

  for (const uni of universities) {
    it(`${uni.id} user can access all protected routes`, async () => {
      useAuthStore.setState({ user: { ...FULL_USER, email: uni.email, university_id: uni.id } })

      for (const path of PROTECTED) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[path]}>
            <GuardedApp authReady={true} />
          </MemoryRouter>
        )
        const pageId = path.replace('/', '')
        await waitFor(() => expect(screen.getByTestId(pageId)).toBeTruthy())
        unmount()
      }
    })
  }
})

// ─── Redirect destination consistency ────────────────────────────────────────

describe('Redirect destination correctness', () => {
  it('unauthenticated user always lands at / (not /auth or /map)', async () => {
    for (const path of PROTECTED) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={true} />
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByTestId('landing')).toBeTruthy()
        expect(screen.queryByTestId('auth')).toBeNull()
      })
      unmount()
    }
  })

  it('authenticated user on / or /auth always lands at /map (not /profile or /feed)', async () => {
    useAuthStore.setState({ user: FULL_USER })
    for (const path of AUTH_ONLY_ANON) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <GuardedApp authReady={true} />
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByTestId('map')).toBeTruthy()
        expect(screen.queryByTestId('landing')).toBeNull()
      })
      unmount()
    }
  })
})
