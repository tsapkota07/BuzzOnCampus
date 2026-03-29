import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../api/firebase'

interface SignupFormProps {
  university_id: string
  universityDomain: string
  initialEmail?: string
  initialUsername?: string
  initialPassword?: string
  theme: {
    inputBg: string
    text: string
    secondary: string
    buttonGradient: string
    subtext: string
    accent: string
  }
  onSwitchToLogin: () => void
  onOtpSent: (email: string, password: string, username: string) => void
}

export default function SignupForm({
  universityDomain,
  initialEmail = '',
  initialUsername = '',
  initialPassword = '',
  theme,
  onSwitchToLogin,
  onOtpSent,
}: SignupFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [username, setUsername] = useState(initialUsername)
  const [password, setPassword] = useState(initialPassword)
  const [confirm, setConfirm] = useState(initialPassword)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const emailDomain = email.split('@')[1]?.toLowerCase() ?? ''
    const base = universityDomain.toLowerCase()
    if (emailDomain !== base && !emailDomain.endsWith(`.${base}`)) {
      setError(`Email must be from ${base} or a subdomain (e.g. student.${base})`)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!username.trim()) {
      setError('Username is required.')
      return
    }

    setLoading(true)
    try {
      const sendOtp = httpsCallable(functions, 'sendOtp')
      await sendOtp({ email })
      onOtpSent(email, password, username.trim())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.05em]" style={{ color: theme.secondary }}>
          Username
        </label>
        <input
          className="w-full h-14 px-6 rounded-lg border-none focus:outline-none focus:ring-2 transition-all"
          style={{ backgroundColor: theme.inputBg, color: theme.text }}
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
      </div>

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
          placeholder="At least 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.05em]" style={{ color: theme.secondary }}>
          Confirm Password
        </label>
        <input
          className="w-full h-14 px-6 rounded-lg border-none focus:outline-none focus:ring-2 transition-all"
          style={{ backgroundColor: theme.inputBg, color: theme.text }}
          type="password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
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
        {loading ? 'Sending code…' : 'Continue'}
        {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>

      <p className="text-center text-sm font-medium pt-2" style={{ color: theme.subtext }}>
        Already have an account?{' '}
        <button type="button" className="font-bold underline" onClick={onSwitchToLogin}>
          Log In
        </button>
      </p>
    </form>
  )
}
