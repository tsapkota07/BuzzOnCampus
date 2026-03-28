import { create } from 'zustand'

interface BuzzStore {
  balance: number
  setBalance: (balance: number) => void
}

export const useBuzzStore = create<BuzzStore>(set => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
}))
