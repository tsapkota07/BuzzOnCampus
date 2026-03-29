import { useMapStore } from '../../store/useMapStore'
import { useAuthStore } from '../../store/useAuthStore'

const UNIVERSITY_THEMES: Record<string, { primary: string; label: string }> = {
  ysu: { primary: '#CC0000', label: 'YSU' },
  kent: { primary: '#002664', label: 'Kent' },
  osu: { primary: '#BB0000', label: 'OSU' },
  other: { primary: '#1985a1', label: '🐝' },
}

const FILTERS = [
  { key: 'event', label: 'Events', icon: '' },
  { key: 'volunteer', label: 'Volunteer', icon: '' },
  { key: 'help', label: 'Help', icon: '' },
  { key: 'places', label: 'Places', icon: '' },
]

export default function Navbar() {
  const user = useAuthStore(state => state.user)
  const buzzBalance = user?.buzz_balance ?? 0
  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'
  const universityId = user?.university_id ?? 'other'

  const theme = UNIVERSITY_THEMES[universityId] ?? UNIVERSITY_THEMES.other
  const primary = theme.primary

  const { activeFilters, toggleFilter } = useMapStore()

  return (
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
        <div
          className="text-xl font-extrabold italic tracking-tight shrink-0"
          style={{ color: primary, fontFamily: 'Manrope, sans-serif' }}
        >
          BuzzOnCampus
        </div>

        {/* Center — search bar */}
        <div className="flex-1 flex justify-center">
          <div
            className="flex items-center gap-2 px-4 h-9 rounded-full w-[40%] min-w-[220px]"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-white/50 text-[18px]">🔍</span>
            <input
              type="text"
              placeholder="Search for events, people or places..."
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Right — buzz points + avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Buzz Points pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: primary }}
          >
            🪙 {buzzBalance} Buzz
          </div>

          {/* User avatar circle */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer"
            style={{ background: primary }}
          >
            {userInitial}
          </div>
        </div>
      </div>

      {/* Filter chips row */}
      <div
        className="flex justify-center gap-2 px-5 py-2"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)' }}
      >
        {FILTERS.map(f => {
          const active = activeFilters.includes(f.key)
          return (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: active ? primary : 'transparent',
                color: active ? '#fff' : primary,
                border: `1.5px solid ${primary}`,
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}