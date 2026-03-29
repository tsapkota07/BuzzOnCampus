import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../api/firebase'
import { useAuthStore, AppUser } from '../../store/useAuthStore'

interface LoginFormProps {
  universityDomain: string
  initialEmail?: string
  theme: {
    inputBg: string
    text: string
    secondary: string
    buttonGradient: string
    subtext: string
    accent: string
  }
  onSwitchToSignup: () => void
  onUnverified: (uid: string, email: string) => void
}

export default function LoginForm({
  universityDomain,
  initialEmail = '',
  theme,
  onSwitchToSignup,
  onUnverified,
}: LoginFormProps) {
  const setUser = useAuthStore(state => state.setUser)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))

      if (!snap.exists()) {
        setError('User profile not found. Please sign up.')
        setLoading(false)
        return
      }

      const data = snap.data()

      if (!data.email_verified) {
        onUnverified(cred.user.uid, email)
        setLoading(false)
        return
      }

      setUser({
        uid: cred.user.uid,
        email: data.email,
        university_id: data.university_id,
        buzz_balance: data.buzz_balance ?? 0,
        color: data.color,
        avatar_url: data.avatar_url ?? null,
      } as AppUser)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.'
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Invalid email or password.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.05em]" style={{ color: theme.secondary }}>
          University Email
        </label>
        <input
          className="w-full h-14 px-6 rounded-lg border-none focus:outline-none focus:ring-2 transition-all"
          style={{ backgroundColor: theme.inputBg, color: theme.text }}
          type="email"
          placeholder={`name@${universityDomain}`}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.05em]" style={{ color: theme.secondary }}>
          Password
        </label>
        <input
          className="w-full h-14 px-6 rounded-lg border-none focus:outline-none focus:ring-2 transition-all"
          style={{ backgroundColor: theme.inputBg, color: theme.text }}
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm font-semibold px-1" style={{ color: theme.accent }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-lg text-white font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: theme.buttonGradient }}
      >
        {loading ? 'Signing in…' : 'Log In'}
        {!loading && <span className="material-symbols-outlined">login</span>}
      </button>

      <p className="text-center text-sm font-medium pt-2" style={{ color: theme.subtext }}>
        Don't have an account?{' '}
        <button type="button" className="font-bold underline" onClick={onSwitchToSignup}>
          Create Account
        </button>
      </p>
    </form>
  )
}
