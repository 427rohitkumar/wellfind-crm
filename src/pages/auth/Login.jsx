import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label, Field, InputGroup, InputGroupText } from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { homeForRole } from '@/services/roles'

export default function Login() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, login, logout } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // If already authenticated with a valid role, redirect to the correct dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const home = homeForRole(user.role)
      if (home) navigate(home, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await login(email.trim(), password)
      const authUser = res?.user

      if (!authUser?.role) {
        await logout()
        setErrorMessage('Authentication error: Unable to verify user role.')
        return
      }

      // Role-based navigation
      const home = homeForRole(authUser.role)
      if (home) {
        navigate(home, { replace: true })
      } else {
        await logout()
        setErrorMessage(
          `Access restricted: The role "${authUser.role}" does not have permission to access this dashboard.`
        )
      }
    } catch (err) {
      if (err.status === 401 || err.isUnauthorized) {
        setErrorMessage('Invalid email or password. Please verify your credentials.')
      } else if (err.status === 403 || err.isForbidden) {
        setErrorMessage('Your account is not active or has been suspended. Please contact support.')
      } else if (err.status === 429) {
        setErrorMessage('Too many login attempts. Please wait 15 minutes before trying again.')
      } else if (err.isNetworkError || err.message?.includes('Cannot connect')) {
        setErrorMessage('Cannot connect to the Wellfind API server. Please ensure the backend is running.')
      } else {
        setErrorMessage(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword)
  }

  return (
    <main className="auth auth--login">
      <section className="auth__panel">
        <Button
          variant="ghost"
          color="neutral"
          size="icon"
          className="auth__toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="auth__form w-full max-w-md mx-auto">
          {/* Mobile brand header (visible on smaller screens) */}
          <div className="auth__mobile-brand">
            <span
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-border, #e2e8f0)',
                flexShrink: 0,
              }}
            >
              <img
                src="/blue-logo-wellfind.png"
                alt="Wellfind Academic"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </span>
            <span className="font-semibold text-base text-foreground tracking-tight">
              Wellfind Academic
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Admins and teachers sign in here with the email and password provided to you.
            </p>
          </div>

          {errorMessage && (
            <div
              className="alert alert--danger"
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md, 0.5rem)',
                backgroundColor: 'color-mix(in oklch, var(--color-danger) 10%, var(--color-surface, #fff))',
                border: 'none',
                color: 'var(--color-danger, #e52629)',
              }}
            >
              <AlertCircle
                className="shrink-0"
                style={{
                  width: '18px',
                  height: '18px',
                  color: 'var(--color-danger, #e52629)',
                }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium leading-normal flex-1">
                {errorMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field>
              <Label htmlFor="loginEmail" className="font-medium text-sm">Email</Label>
              <InputGroup size="lg" className="w-full">
                <InputGroupText>
                  <Mail className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </InputGroupText>
                <Input
                  type="email"
                  id="loginEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="flex-1 w-full min-w-0"
                />
              </InputGroup>
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="loginPassword" className="font-medium text-sm">Password</Label>
                <Link to="/forgot-password" className="link text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <InputGroup size="lg" className="w-full">
                <InputGroupText>
                  <Lock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </InputGroupText>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                  className="flex-1 w-full min-w-0"
                />
                <button
                  type="button"
                  className="input-group__text cursor-pointer hover:text-foreground transition-colors p-2.5 focus:outline-none"
                  onClick={handlePasswordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                </button>
              </InputGroup>
            </Field>

            <div
              className="field__item flex items-center my-1.5"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <input
                type="checkbox"
                id="loginRemember"
                className="checkbox cursor-pointer"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label
                htmlFor="loginRemember"
                className="field__label cursor-pointer select-none text-sm font-normal text-muted-foreground"
                style={{
                  cursor: 'pointer',
                  margin: 0,
                  paddingLeft: '0.625rem',
                  userSelect: 'none',
                }}
              >
                Keep me signed in
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="button--block w-full justify-center text-base py-3 font-semibold shadow-sm hover:shadow transition-all"
              loading={isSubmitting}
            >
              Sign in
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </form>

          <div className="pt-2 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Default super_admin: <span className="font-mono font-medium text-foreground">427rohit@gmail.com</span>
            </p>
          </div>
        </div>
      </section>

      <aside className="auth__aside auth__aside--image">
        <img
          src="/login-page-image.png"
          alt="Wellfind Academic"
          className="auth__aside-cover-img"
        />
      </aside>
    </main>
  )
}
