import { create } from 'zustand'

// User shape returned from Firebase Auth + Firestore user doc
export interface AppUser {
  uid: string
  email: string
  university_id: string
  buzz_balance: number
  color: string
  avatar_url: string | null
}

interface AuthStore {
  user: AppUser | null
  setUser: (user: AppUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
