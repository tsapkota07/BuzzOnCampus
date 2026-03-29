import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import OtpScreen from '../components/auth/OtpScreen'

interface LocationState {
  university_id?: string
  universityName?: string
  universityDomain?: string
  isSignup?: boolean
  email?: string
  username?: string
  password?: string
  photos?: string[]
  theme?: Theme
}

interface Theme {
  primary: string
  secondary: string
  accent: string
  bg: string
  inputBg: string
  text: string
  subtext: string
  buttonGradient: string
  fadeSide: string
}

const defaultTheme: Theme = {
  primary: '#fd8b00',
  secondary: '#8c4a00',
  accent: '#fd8b00',
  bg: '#fff5ed',
  inputBg: '#ffd6ab',
  text: '#452800',
  subtext: '#5c5b5b',
  buttonGradient: 'linear-gradient(135deg, #fd8b00 0%, #8c4a00 100%)',
  fadeSide: '#fff5ed',
}

const defaultPhotos = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
  'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600&q=80',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&q=80',
]

type Screen = 'login' | 'signup' | 'otp'

export default function AuthPage() {
  const user = useAuthStore(state => state.user)
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as LocationState

  const university_id = state.university_id ?? ''
  const universityName = state.universityName ?? 'Your University'
  const universityDomain = state.universityDomain ?? 'university.edu'
  const theme = state.theme ?? defaultTheme
  const photos = state.photos ?? defaultPhotos

  const [screen, setScreen] = useState<Screen>(state.isSignup ? 'signup' : 'login')
  // OTP screen state — set when user needs to verify
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingUid, setPendingUid] = useState<string | null>(null)  // login mode: uid of unverified user
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string; password: string; username: string
  } | null>(null)  // signup mode: data to create account after OTP

  if (user) return <Navigate to="/map" replace />
  if (!university_id) return <Navigate to="/" replace />

  // Called by LoginForm when credentials are correct but account not yet OTP-verified
  const handleUnverified = (uid: string, email: string) => {
    setPendingEmail(email)
    setPendingUid(uid)
    setPendingSignupData(null)
    setScreen('otp')
  }

  // Called by SignupForm after OTP is sent successfully
  const handleOtpSent = (email: string, password: string, username: string) => {
    setPendingEmail(email)
    setPendingUid(null)
    setPendingSignupData({ email, password, username })
    setScreen('otp')
  }

  const headings: Record<Screen, string> = {
    login: 'Welcome back',
    signup: 'Create your account',
    otp: 'Check your inbox',
  }

  const subheadings: Record<Screen, string> = {
    login: 'Sign in to access your campus feed.',
    signup: `Sign up with your ${universityDomain} email to get started.`,
    otp: 'If your email is valid, a 6-digit code has been sent to it.',
  }

  return (
    <main
      className="flex h-screen w-full flex-col md:flex-row overflow-hidden"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: "'Manrope', sans-serif",
        transition: 'background-color 0.6s ease, color 0.6s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; }
      `}</style>

      {/* LEFT PANEL */}
      <section
        className="w-full md:w-[40%] h-full p-8 md:p-12 flex flex-col z-10 relative overflow-y-auto"
        style={{ backgroundColor: theme.bg, transition: 'background-color 0.6s ease' }}
      >
        <header className="flex justify-between items-center w-full mb-10">
          <button
            className="text-2xl font-black italic tracking-tighter"
            style={{ color: theme.accent }}
            onClick={() => navigate('/')}
          >
            BuzzOnCampus
          </button>
          <span className="text-sm font-semibold opacity-70" style={{ color: theme.subtext }}>
            {universityName}
          </span>
        </header>

        <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] mb-2" style={{ color: theme.text }}>
            {headings[screen]}
          </h1>
          <p className="font-medium leading-relaxed mb-8 opacity-80" style={{ color: theme.subtext }}>
            {subheadings[screen]}
          </p>

          {screen === 'login' && (
            <LoginForm
              universityDomain={universityDomain}
              initialEmail={state.email}
              theme={theme}
              onSwitchToSignup={() => setScreen('signup')}
              onUnverified={handleUnverified}
            />
          )}

          {screen === 'signup' && (
            <SignupForm
              university_id={university_id}
              universityDomain={universityDomain}
              initialEmail={state.email}
              initialUsername={state.username}
              initialPassword={state.password}
              theme={theme}
              onSwitchToLogin={() => setScreen('login')}
              onOtpSent={handleOtpSent}
            />
          )}

          {screen === 'otp' && (
            <OtpScreen
              email={pendingEmail}
              uid={pendingUid ?? undefined}
              university_id={university_id}
              theme={theme}
              pendingSignupData={pendingSignupData}
              onVerified={() => {}}
              onBack={() => setScreen(pendingSignupData ? 'signup' : 'login')}
            />
          )}
        </div>

        <footer className="mt-auto pt-8 flex flex-wrap gap-x-6 gap-y-2 opacity-60">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.subtext }}>
            © 2025 BuzzOnCampus
          </span>
          <a href="#" className="text-[10px] uppercase tracking-wider" style={{ color: theme.subtext }}>
            Privacy Policy
          </a>
          <a href="#" className="text-[10px] uppercase tracking-wider" style={{ color: theme.subtext }}>
            Terms of Service
          </a>
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
              opacity: i === 0 ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          />
        ))}
        <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: `${theme.primary}33` }} />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--fade)] via-transparent to-transparent opacity-60"
          style={{ '--fade': theme.fadeSide } as React.CSSProperties}
        />
      </section>
    </main>
  )
}
