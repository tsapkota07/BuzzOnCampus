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

export interface MockUserPin {
  id: string
  type: 'event' | 'volunteer' | 'help'
  title: string
  description: string
  lat: number
  lng: number
  userColor: string
  username: string
  buzzReward: number
  participantCount: number
  createdAt: string
}

export interface MockPlace {
  id: string
  category: string
  name: string
  lat: number
  lng: number
  posts: MockPlacePost[]
}

export interface MockPlacePost {
  id: string
  type: 'deal' | 'event' | 'announcement' | 'review'
  title: string | null
  body: string | null
  buzzCost?: number
  expiresIn?: string
  eventDate?: string
  username?: string
  rating?: number
}

interface MapStore {
  pins: Pin[]
  filters: PinType[]
  activeFilters: string[]
  selectedPin: MockUserPin | null
  selectedPlace: MockPlace | null
  setPins: (pins: Pin[]) => void
  addPin: (pin: Pin) => void
  updatePin: (id: string, updates: Partial<Pin>) => void
  removePin: (id: string) => void
  setFilters: (filters: PinType[]) => void
  setActiveFilters: (filters: string[]) => void
  toggleFilter: (filter: string) => void
  setSelectedPin: (pin: MockUserPin | null) => void
  setSelectedPlace: (place: MockPlace | null) => void
}

const ALL_TYPES: PinType[] = ['event', 'volunteer', 'help', 'business']
const ALL_FILTERS = ['event', 'volunteer', 'help', 'places']

export const useMapStore = create<MapStore>(set => ({
  pins: [],
  filters: ALL_TYPES,
  activeFilters: ALL_FILTERS,
  selectedPin: null,
  selectedPlace: null,
  setPins: (pins) => set({ pins }),
  addPin: (pin) => set(state => ({ pins: [...state.pins, pin] })),
  updatePin: (id, updates) =>
    set(state => ({
      pins: state.pins.map(p => p.id === id ? { ...p, ...updates } : p),
    })),
  removePin: (id) => set(state => ({ pins: state.pins.filter(p => p.id !== id) })),
  setFilters: (filters) => set({ filters }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  toggleFilter: (filter) =>
    set(state => ({
      activeFilters: state.activeFilters.includes(filter)
        ? state.activeFilters.filter(f => f !== filter)
        : [...state.activeFilters, filter],
    })),
  setSelectedPin: (pin) => set({ selectedPin: pin, selectedPlace: null }),
  setSelectedPlace: (place) => set({ selectedPlace: place, selectedPin: null }),
}))
