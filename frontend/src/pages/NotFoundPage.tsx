import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main
      className="flex h-screen w-full items-center justify-center flex-col gap-6"
      style={{
        backgroundColor: '#fff5ed',
        fontFamily: "'Inter', sans-serif",
        color: '#452800',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; }
      `}</style>

      <span className="material-symbols-outlined" style={{ fontSize: 72, color: '#fd8b00' }}>
        location_off
      </span>

      <div className="text-center space-y-2">
        <h1 className="text-8xl font-black italic tracking-tighter" style={{ color: '#fd8b00' }}>
          404
        </h1>
        <p className="text-xl font-bold">Page not found</p>
        <p className="text-sm opacity-60" style={{ color: '#5c5b5b' }}>
          This spot on campus doesn't exist.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="h-12 px-6 rounded-lg font-bold text-sm border-2 transition-all hover:brightness-90 active:scale-95"
          style={{ borderColor: '#fd8b00', color: '#fd8b00', backgroundColor: 'transparent' }}
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="h-12 px-6 rounded-lg font-bold text-sm text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #fd8b00 0%, #8c4a00 100%)' }}
        >
          Back to Home
        </button>
      </div>
    </main>
  )
}
