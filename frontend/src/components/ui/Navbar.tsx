import { useMapStore } from '../../store/useMapStore'

const FILTERS = [
  { key: 'event',     label: 'Events',    icon: '📅', color: '#3B82F6' },
  { key: 'volunteer', label: 'Volunteer', icon: '🤝', color: '#22C55E' },
  { key: 'help',      label: 'Help',      icon: '👋', color: '#F59E0B' },
  { key: 'places',    label: 'Places',    icon: '📍', color: '#8B5CF6' },
]

export default function Navbar() {
  // TODO: Get buzz balance and user from useAuthStore
  const buzzBalance = 20
  const userInitial = 'S'

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
          style={{ color: '#fd8b00', fontFamily: 'Manrope, sans-serif' }}
        >
          BuzzOnCampus
        </div>

        {/* Center — search bar */}
        <div className="flex-1 flex justify-center">
          <div
            className="flex items-center gap-2 px-4 h-9 rounded-full w-[40%] min-w-[220px]"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="material-symbols-outlined text-white/50 text-[18px]">search</span>
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
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fd8b00' }}
          >
            🪙 {buzzBalance} Buzz
          </div>

          {/* User avatar circle */}
          {/* TODO: Get from useAuthStore — show avatar_url if available */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer"
            style={{ background: '#fd8b00' }}
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
        {/* TODO: Connect filter state to pin rendering — hide/show markers based on activeFilters array */}
        {FILTERS.map(f => {
          const active = activeFilters.includes(f.key)
          return (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: active ? f.color : 'transparent',
                color: active ? '#fff' : f.color,
                border: `1.5px solid ${f.color}`,
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
