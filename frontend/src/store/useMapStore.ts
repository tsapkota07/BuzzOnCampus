import { create } from 'zustand'

export type PinType = 'event' | 'volunteer' | 'help' | 'business'

export interface Pin {
  id: string
  user_id: string
  user_color: string
  type: PinType
  title: string
  description: string
  buzz_reward: number
  lat: number
  lng: number
  status: 'active' | 'completed' | 'cancelled'
  university_id: string
  event_date: string | null
  participant_count: number
  created_at: string
}

interface MapStore {
  pins: Pin[]
  filters: PinType[]
  setPins: (pins: Pin[]) => void
  addPin: (pin: Pin) => void
  updatePin: (id: string, updates: Partial<Pin>) => void
  removePin: (id: string) => void
  setFilters: (filters: PinType[]) => void
}

const ALL_TYPES: PinType[] = ['event', 'volunteer', 'help', 'business']

export const useMapStore = create<MapStore>(set => ({
  pins: [],
  filters: ALL_TYPES,
  setPins: (pins) => set({ pins }),
  addPin: (pin) => set(state => ({ pins: [...state.pins, pin] })),
  updatePin: (id, updates) =>
    set(state => ({
      pins: state.pins.map(p => p.id === id ? { ...p, ...updates } : p),
    })),
  removePin: (id) => set(state => ({ pins: state.pins.filter(p => p.id !== id) })),
  setFilters: (filters) => set({ filters }),
}))
