import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface University {
  id: string
  name: string
  domain: string
  lat: number
  lng: number
  website: string
  logo: string
  photos: string[]
  theme: {
    primary: string
    secondary: string
    accent: string
    bg: string
    inputBg: string
    text: string
    subtext: string
    buttonGradient: string
    overlay: string
    fadeSide: string
  }
}

const universities: University[] = [
  {
    id: 'kent',
    name: 'Kent State University',
    domain: 'kent.edu',
    lat: 41.1534,
    lng: -81.3579,
    website: 'https://www.kent.edu',
    logo: '/universities/ksu-logo.jpg',
    photos: ['/universities/ksu-1.jpg', '/universities/ksu-2.jpg', '/universities/ksu-3.jpg'],
    theme: {
      primary: '#002664',
      secondary: '#EAAA00',
      accent: '#EAAA00',
      bg: '#f0f4ff',
      inputBg: '#d6e0f5',
      text: '#001133',
      subtext: '#334477',
      buttonGradient: 'linear-gradient(135deg, #002664 0%, #0044aa 100%)',
      overlay: '#002664/25',
      fadeSide: '#f0f4ff',
    },
  },
  {
    id: 'osu',
    name: 'Ohio State University',
    domain: 'osu.edu',
    lat: 40.0067,
    lng: -83.0305,
    website: 'https://www.osu.edu',
    logo: '/universities/osu-logo.png',
    photos: ['/universities/osu-1.jpg', '/universities/osu-2.jpg', '/universities/osu-3.jpg'],
    theme: {
      primary: '#BA0C2F',
      secondary: '#666666',
      accent: '#BA0C2F',
      bg: '#fff5f7',
      inputBg: '#f5d0d8',
      text: '#3b0010',
      subtext: '#7a2030',
      buttonGradient: 'linear-gradient(135deg, #BA0C2F 0%, #8a0020 100%)',
      overlay: '#BA0C2F/25',
      fadeSide: '#fff5f7',
    },
  },
  {
    id: 'ysu',
    name: 'Youngstown State University',
    domain: 'ysu.edu',
    lat: 41.1006,
    lng: -80.6481,
    website: 'https://www.ysu.edu',
    logo: '/universities/ysu-logo.png',
    photos: ['/universities/ysu-1.jpg', '/universities/ysu-2.jpg', '/universities/ysu-3.jpg'],
    theme: {
      primary: '#CC0000',
      secondary: '#333333',
      accent: '#CC0000',
      bg: '#fff5f5',
      inputBg: '#f5d0d0',
      text: '#3b0000',
      subtext: '#7a2020',
      buttonGradient: 'linear-gradient(135deg, #CC0000 0%, #990000 100%)',
      overlay: '#CC0000/25',
      fadeSide: '#fff5f5',
    },
  },
  {
    id: 'general',
    name: 'General Email (Testing)',
    domain: 'gmail.com',
    lat: 41.1006,
    lng: -80.6481,
    website: '#',
    logo: '',
    photos: [
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
      'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
      'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&q=80',
    ],
    theme: {
      primary: '#fd8b00',
      secondary: '#8c4a00',
      accent: '#fd8b00',
      bg: '#fff5ed',
      inputBg: '#ffd6ab',
      text: '#452800',
      subtext: '#5c5b5b',
      buttonGradient: 'linear-gradient(135deg, #fd8b00 0%, #8c4a00 100%)',
      overlay: '#fd8b00/20',
      fadeSide: '#fff5ed',
    },
  },
]

const defaultTheme = {
  primary: '#fd8b00',
  secondary: '#8c4a00',
  accent: '#fd8b00',
  bg: '#fff5ed',
  inputBg: '#ffd6ab',
  text: '#452800',
  subtext: '#5c5b5b',
  buttonGradient: 'linear-gradient(135deg, #fd8b00 0%, #8c4a00 100%)',
  overlay: '#8c4a00/20',
  fadeSide: '#fff5ed',
}

const defaultPhotos = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
  'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&q=80',
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [photos, setPhotos] = useState(defaultPhotos)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const theme = selectedUniversity?.theme ?? defaultTheme

  useEffect(() => {
    if (photos.length <= 1) return
    setCurrentSlide(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % photos.length)
    }, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [photos])

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = universities.find(u => u.id === e.target.value) ?? null
    setSelectedUniversity(found)
    setError('')
    setPhotos(found ? found.photos : defaultPhotos)
  }

  const goToAuth = (isSignup: boolean) => {
    if (!selectedUniversity) { setError('Please select your university first.'); return }
    navigate('/auth', {
      state: {
        university_id: selectedUniversity.id,
        universityName: selectedUniversity.name,
        universityDomain: selectedUniversity.domain,
        isSignup,
        photos: selectedUniversity.photos,
        theme: selectedUniversity.theme,
      },
    })
  }

  return (
    <main
      className="flex h-screen w-full flex-col md:flex-row overflow-hidden"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: "'Inter', sans-serif",
        transition: 'background-color 0.6s ease, color 0.6s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; }
        .glass-panel { background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); }
        select, input { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* LEFT PANEL */}
      <section className="w-full md:w-[40%] h-full p-8 md:p-12 flex flex-col z-10 relative overflow-y-auto"
        style={{ backgroundColor: theme.bg, transition: 'background-color 0.6s ease' }}>

        <header className="flex justify-between items-center w-full mb-16">
          <div className="text-2xl font-black italic tracking-tighter" style={{ color: theme.accent }}>
            BuzzOnCampus
          </div>
          <button className="text-sm font-bold uppercase tracking-wider px-4 py-2 transition-colors duration-200 rounded-lg"
            style={{ color: theme.secondary }}>
            Contact Support
          </button>
        </header>

        <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6" style={{ color: theme.text }}>
            Connect. <span className="italic" style={{ color: theme.accent }}>Thrive.</span><br />Experience Campus.
          </h1>
          <p className="font-medium leading-relaxed mb-10 opacity-80" style={{ color: theme.subtext }}>
            Your institutional gateway to events, networking, and academic resources. Select your university to begin.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.05em]" style={{ color: theme.secondary }}>
                Institutional Access
              </label>
              <div className="relative">
                <select
                  className="w-full h-14 px-6 rounded-lg border-none focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer font-medium"
                  style={{ backgroundColor: theme.inputBg, color: theme.text, transition: 'background-color 0.6s ease' }}
                  value={selectedUniversity?.id ?? ''}
                  onChange={handleUniversityChange}
                >
                  <option value="">Select your university...</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: theme.secondary }}>expand_more</span>
              </div>
            </div>

            {error && <p className="text-sm font-semibold px-1" style={{ color: theme.accent }}>{error}</p>}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => goToAuth(false)}
                className="w-full h-14 rounded-lg text-white font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: theme.buttonGradient }}
              >
                Log In
                <span className="material-symbols-outlined">login</span>
              </button>
              <button
                onClick={() => goToAuth(true)}
                className="w-full h-14 rounded-lg font-bold text-lg border-2 hover:brightness-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: 'transparent' }}
              >
                Create Account
                <span className="material-symbols-outlined">person_add</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-auto pt-8 flex flex-wrap gap-x-6 gap-y-2 opacity-60">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.subtext }}>© 2025 BuzzOnCampus</span>
          <a href="#" className="text-[10px] uppercase tracking-wider transition-colors" style={{ color: theme.subtext }}>Privacy Policy</a>
          <a href="#" className="text-[10px] uppercase tracking-wider transition-colors" style={{ color: theme.subtext }}>Terms of Service</a>
        </footer>
      </section>

      {/* RIGHT PANEL */}
      <section className="hidden md:block w-[60%] h-full relative overflow-hidden">
        {photos.map((photo, i) => (
          <div
            key={photo}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${photo}')`,
              opacity: i === currentSlide ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          />
        ))}
        <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: `${theme.primary}33` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--fade)] via-transparent to-transparent opacity-60"
          style={{ '--fade': theme.fadeSide } as React.CSSProperties} />

        {selectedUniversity && (
          <div className="absolute bottom-12 left-12 flex items-center gap-6 z-20">
            <a
              href={selectedUniversity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-4 rounded-xl shadow-xl border border-white/20 hover:scale-105 transition-transform duration-200"
              title={`Visit ${selectedUniversity.name}`}
            >
              <img
                src={selectedUniversity.logo}
                alt={`${selectedUniversity.name} logo`}
                className="h-16 w-auto object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </a>
            <a
              href={selectedUniversity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel px-6 py-4 rounded-full shadow-lg border border-white/20 flex items-center gap-3 group transition-all duration-300"
              style={{ '--hover-bg': theme.primary } as React.CSSProperties}
            >
              <span className="font-bold text-sm tracking-wide" style={{ color: theme.text }}>For More Info</span>
              <span className="material-symbols-outlined text-lg" style={{ color: theme.primary }}>open_in_new</span>
            </a>
          </div>
        )}

        {/* Slide dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 right-6 flex gap-2 z-20">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === currentSlide ? 'white' : 'rgba(255,255,255,0.4)' }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Mobile FAB */}
      <div className="fixed bottom-8 right-8 md:hidden">
        <button
          className="h-16 w-16 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-95 duration-150"
          style={{ background: theme.buttonGradient }}
        >
          <span className="material-symbols-outlined text-3xl">school</span>
        </button>
      </div>
    </main>
  )
}