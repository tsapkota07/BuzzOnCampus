import { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../api/firebase'
import { useMapStore } from '../../store/useMapStore'
import { useAuthStore } from '../../store/useAuthStore'
import { getTheme } from '../../utils/themes'

const FILTERS = [
  { key: 'event', label: 'Events', icon: '' },
  { key: 'volunteer', label: 'Volunteer', icon: '' },
  { key: 'help', label: 'Help', icon: '' },
  { key: 'places', label: 'Places', icon: '' },
]

export default function Navbar() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const buzzBalance = user?.buzz_balance ?? 0
  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'
  const universityId = user?.university_id ?? 'other'

  const theme = getTheme(universityId)
  const primary = theme.primary

  const { activeFilters, toggleFilter } = useMapStore()

  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const logoutBtnRef = useRef<HTMLButtonElement>(null)

  // Esc to close modal + focus Cancel when modal opens
  useEffect(() => {
    if (!logoutModalOpen) return
    cancelBtnRef.current?.focus()
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLogoutModalOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [logoutModalOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogoutConfirm = async () => {
    await signOut(auth)
    logout()
    setLogoutModalOpen(false)
  }

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-50 flex flex-col">
        {/* Main navbar row */}
        <div
          className="flex items-center px-5 py-3 gap-4"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Left — wordmark */}
          <div className="flex items-center gap-2 shrink-0 cursor-default select-none">
            <div style={{
              width: 30, height: 30,
              borderRadius: 8,
              background: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
              boxShadow: `0 2px 10px ${primary}88`,
            }}>
              📍
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span style={{ color: 'white' }}>Buzz</span><span style={{ color: primary }}>On</span><span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Campus</span>
            </div>
          </div>

          {/* Center — filter chips + expandable search */}
          <div className="flex-1 flex items-center justify-center gap-2">

            {/* Filter chips — hidden when search is expanded */}
            {!searchExpanded && FILTERS.map(f => {
              const active = activeFilters.includes(f.key)
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shrink-0"
                  style={{
                    background: active ? primary : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                    border: `1.5px solid ${active ? primary : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {f.label}
                </button>
              )
            })}

            {/* Expandable search bar */}
            <div
              className="flex items-center gap-2 px-4 h-9 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: searchExpanded ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${searchExpanded ? primary : 'rgba(255,255,255,0.15)'}`,
                width: searchExpanded ? 280 : 90,
                overflow: 'hidden',
                flexShrink: 0,
              }}
              onClick={() => {
                if (!searchExpanded) {
                  setSearchExpanded(true)
                  setTimeout(() => searchRef.current?.focus(), 50)
                }
              }}
            >
              {!searchExpanded ? (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Search
                </span>
              ) : (
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search events, people, places..."
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/40"
                  onBlur={() => setSearchExpanded(false)}
                />
              )}
            </div>
          </div>

          {/* Right — buzz points + avatar */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Buzz Points pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: `${primary}55`, color: 'white', border: `1px solid ${primary}88` }}
            >
              🪙 {buzzBalance} Buzz
            </div>

            {/* User avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(o => !o)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none"
                style={{ background: primary }}
              >
                {userInitial}
              </div>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(20,20,35,0.97)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate('/profile') }}
                  >
                    <span>👤</span> Profile
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate('/feed') }}
                  >
                    <span>📋</span> Feed
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate('/admin') }}
                  >
                    <span>🛡️</span> Admin
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
                    style={{ color: '#ff5555' }}
                    onClick={() => { setDropdownOpen(false); setLogoutModalOpen(true) }}
                  >
                    <span>🚪</span> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Logout confirmation modal */}
      {logoutModalOpen && (
        <>
          <div
            onClick={() => setLogoutModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 200,
            }}
          />
          <div
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault()
                if (document.activeElement === cancelBtnRef.current) {
                  logoutBtnRef.current?.focus()
                } else {
                  cancelBtnRef.current?.focus()
                }
              }
            }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 320,
              background: 'rgba(20,20,35,0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '28px 24px',
              zIndex: 201,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <h2 className="text-white font-extrabold text-lg mb-2">Log out?</h2>
            <p className="text-sm mb-6" style={{ color: '#aaa' }}>
              You'll need to sign in again to access the map.
            </p>
            <div className="flex gap-3">
              <button
                ref={cancelBtnRef}
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc' }}
              >
                Cancel
              </button>
              <button
                ref={logoutBtnRef}
                onClick={handleLogoutConfirm}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#ff5555', color: 'white' }}
              >
                Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}