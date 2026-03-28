import { useState, useRef, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, functions } from '../../api/firebase'
import { useAuthStore } from '../../store/useAuthStore'

const USER_COLORS = ['#14B8A6', '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6366F1']

interface PendingSignupData {
  email: string
  password: string
  username: string
}

interface OtpScreenProps {
  email: string
  university_id: string
  theme: {
    inputBg: string
    text: string
    secondary: string
    buttonGradient: string
    subtext: string
    accent: string
    bg: string
  }
  pendingSignupData: PendingSignupData | null
  onVerified: () => void
  onBack: () => void
}

export default function OtpScreen({ email, university_id, theme, pendingSignupData, onVerified, onBack }: OtpScreenProps) {
  const setUser = useAuthStore(state => state.setUser)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(600)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleDigitChange = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[i] = value
    setDigits(next)
    setError('')
    if (value && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = digits.join('')
    if (code.length < 6) { setError('Enter all 6 digits.'); return }
    if (!pendingSignupData) { setError('Signup data missing. Please go back and try again.'); return }

    setLoading(true)
    setError('')
    try {
      // Step 1: verify OTP with Cloud Function
      const verifyOtp = httpsCallable(functions, 'verifyOtp')
      await verifyOtp({ email, code })

      // Step 2: create Firebase Auth account
      const { email: signupEmail, password, username } = pendingSignupData
      const cred = await createUserWithEmailAndPassword(auth, signupEmail, password)
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]

      // Step 3: write Firestore user doc
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: signupEmail,
        username,
        university_id,
        buzz_balance: 0,   // onUserCreated Cloud Function sets this to 20
        color,
        avatar_url: null,
        created_at: serverTimestamp(),
      })

      setUser({
        uid: cred.user.uid,
        email: signupEmail,
        university_id,
        buzz_balance: 0,
        color,
        avatar_url: null,
      })

      onVerified()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.'
      setError(msg)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setDigits(['', '', '', '', '', ''])
    setCountdown(600)
    try {
      const sendOtp = httpsCallable(functions, 'sendOtp')
      await sendOtp({ email })
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend code. Try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium leading-relaxed opacity-80" style={{ color: theme.subtext }}>
          We sent a 6-digit code to
        </p>
        <p className="font-bold" style={{ color: theme.text }}>{email}</p>
      </div>

      <div className="flex gap-3 justify-between" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el }}
            className="w-12 h-14 text-center text-2xl font-black rounded-lg border-none focus:outline-none focus:ring-2 transition-all"
            style={{ backgroundColor: theme.inputBg, color: theme.text }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigitChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <p className="text-sm text-center" style={{ color: theme.subtext }}>
        {countdown > 0
          ? <>Code expires in <strong>{formatCountdown(countdown)}</strong></>
          : <span style={{ color: theme.accent }}>Code expired — request a new one below.</span>
        }
      </p>

      {error && <p className="text-sm font-semibold px-1" style={{ color: theme.accent }}>{error}</p>}

      <button
        onClick={handleVerify}
        disabled={loading || countdown === 0}
        className="w-full h-14 rounded-lg text-white font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: theme.buttonGradient }}
      >
        {loading ? 'Verifying…' : 'Verify & Create Account'}
        {!loading && <span className="material-symbols-outlined">verified</span>}
      </button>

      <div className="flex justify-between items-center pt-1">
        <button type="button" className="text-sm font-bold underline" style={{ color: theme.subtext }} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          disabled={resending}
          className="text-sm font-bold underline disabled:opacity-50"
          style={{ color: theme.subtext }}
          onClick={handleResend}
        >
          {resending ? 'Sending…' : 'Resend Code'}
        </button>
      </div>
    </div>
  )
}
