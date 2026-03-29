import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// Minimal route guard — mirrors App.tsx logic
function GuardedRoutes({ authReady }: { authReady: boolean }) {
  const { user } = useAuthStore()
  if (!authReady) return <div>loading</div>
  return (
    <Routes>
      <Route path="/" element={<div>landing</div>} />
      <Route path="/auth" element={<div>auth</div>} />
      <Route path="/map" element={user ? <div>map</div> : <Navigate to="/" replace />} />
    </Routes>
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

describe('Route guard — unauthenticated', () => {
  it('redirects /map to / when no user', async () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedRoutes authReady={true} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('landing')).toBeTruthy()
      expect(screen.queryByText('map')).toBeNull()
    })
  })

  it('shows loading while auth is not ready', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedRoutes authReady={false} />
      </MemoryRouter>
    )
    expect(screen.getByText('loading')).toBeTruthy()
    expect(screen.queryByText('map')).toBeNull()
  })

  it('shows landing page at / when no user', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GuardedRoutes authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByText('landing')).toBeTruthy()
  })
})

describe('Route guard — authenticated', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'test@kent.edu',
    university_id: 'kent',
    buzz_balance: 20,
    color: '#14B8A6',
    avatar_url: null,
  }

  beforeEach(() => {
    useAuthStore.setState({ user: mockUser })
  })

  it('shows map when user is logged in', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedRoutes authReady={true} />
      </MemoryRouter>
    )
    expect(screen.getByText('map')).toBeTruthy()
  })

  it('does not show map before auth is ready even with user in store', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <GuardedRoutes authReady={false} />
      </MemoryRouter>
    )
    expect(screen.getByText('loading')).toBeTruthy()
    expect(screen.queryByText('map')).toBeNull()
  })
})
