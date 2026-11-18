import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, Sun, Moon, KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label, Field, InputGroup, InputGroupText } from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { requestPasswordReset, resetPasswordWithToken, verifyResetOtp } from '@/services/authService'

const STEPS = {
  email: { title: 'Reset password', lede: "Enter your account email and we'll send a 4-digit OTP." },
  otp: { title: 'Enter OTP', lede: 'Enter the 4-digit code sent to your email. It expires in 10 minutes.' },
  password: { title: 'Set new password', lede: 'Choose a new password of at least 8 characters.' },
  done: { title: 'Password updated', lede: 'You can now sign in with your new password.' },
}

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const run = async (fn) => {
    setIsLoading(true)
    setError('')
    setInfo('')
    try {
      await fn()
    } catch (err) {
      setError(err.status === 429 ? 'Too many requests. Please wait a bit and try again.' : err.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendOtp = (e) => {
    e?.preventDefault()
    return run(async () => {
      await requestPasswordReset(email.trim())
      setStep('otp')
      setInfo('If an account exists for this email, an OTP has been sent.')
    })
  }

  const checkOtp = (e) => {
    e.preventDefault()
    return run(async () => {
      const res = await verifyResetOtp(email.trim(), otp.trim())
      if (!res?.resetAuthToken) throw new Error('Could not verify OTP.')
      setResetToken(res.resetAuthToken)
      setStep('password')
    })
  }

  const savePassword = (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    return run(async () => {
      await resetPasswordWithToken(resetToken, password)
      setStep('done')
    })
  }

  return (
    <main className="auth">
      <section className="auth__panel">
        <Button variant="ghost" color="neutral" size="icon" className="auth__toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="auth__form">
          <div className="auth__mobile-brand">
            <img src="/blue-logo-wellfind.png" alt="Wellfind Academic" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span className="font-semibold text-base text-foreground tracking-tight">Wellfind Academic</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{STEPS[step].title}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{STEPS[step].lede}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              style={{ color: 'var(--color-danger)', backgroundColor: 'color-mix(in oklch, var(--color-danger) 10%, var(--color-surface, #fff))' }}
            >
              <AlertCircle size={16} className="shrink-0" /> <span>{error}</span>
            </div>
          )}
          {info && !error && <p className="text-sm text-muted-foreground">{info}</p>}

          {step === 'email' && (
            <form onSubmit={sendOtp} className="flex flex-col gap-4">
              <Field>
                <Label htmlFor="forgotEmail">Email</Label>
                <InputGroup size="lg">
                  <InputGroupText><Mail className="w-5 h-5" aria-hidden="true" /></InputGroupText>
                  <Input type="email" id="forgotEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </InputGroup>
              </Field>
              <Button type="submit" variant="primary" size="lg" className="button--block" loading={isLoading}>
                Send OTP <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={checkOtp} className="flex flex-col gap-4">
              <Field>
                <Label htmlFor="forgotOtp">4-digit OTP</Label>
                <InputGroup size="lg">
                  <InputGroupText><KeyRound className="w-5 h-5" aria-hidden="true" /></InputGroupText>
                  <Input id="forgotOtp" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="1234" autoComplete="one-time-code" required />
                </InputGroup>
              </Field>
              <Button type="submit" variant="primary" size="lg" className="button--block" loading={isLoading} disabled={otp.length !== 4}>
                Verify OTP <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
              <button type="button" className="text-sm text-primary hover:underline self-center" disabled={isLoading} onClick={sendOtp}>
                Resend OTP
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={savePassword} className="flex flex-col gap-4">
              <Field>
                <Label htmlFor="newPassword">New password</Label>
                <InputGroup size="lg">
                  <InputGroupText><Lock className="w-5 h-5" aria-hidden="true" /></InputGroupText>
                  <Input type="password" id="newPassword" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                </InputGroup>
              </Field>
              <Field>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <InputGroup size="lg">
                  <InputGroupText><Lock className="w-5 h-5" aria-hidden="true" /></InputGroupText>
                  <Input type="password" id="confirmPassword" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
                </InputGroup>
              </Field>
              <Button type="submit" variant="primary" size="lg" className="button--block" loading={isLoading}>Update password</Button>
            </form>
          )}

          {step === 'done' && (
            <div className="flex flex-col gap-4 text-center items-center">
              <CheckCircle2 className="w-10 h-10 text-success" aria-hidden="true" />
              <Link to="/" className="button button--primary button--lg button--block">Go to sign in</Link>
            </div>
          )}

          {step !== 'done' && (
            <p className="text-center">
              <Link to="/" className="button button--ghost button--neutral button--sm">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </section>

      <aside className="auth__aside">
        <Link to="/" className="auth__brand">
          <span
            className="auth__brand-mark"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              flexShrink: 0,
            }}
          >
            <img src="/blue-logo-wellfind.png" alt="Wellfind Academic" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </span>
          <span className="auth__brand-text">
            <span className="auth__brand-name">Wellfind Academic</span>
          </span>
        </Link>
        <div className="auth__pitch">
          <h2 className="auth__pitch-title">Managed <span>Education Network</span></h2>
          <p className="auth__pitch-lede">
            One secure sign-in for admins and teachers. Use the OTP flow to set or recover your password.
          </p>
        </div>
      </aside>
    </main>
  )
}
