import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label, Field, InputGroup, InputGroupText } from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'

export default function Register() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    navigate('/')
  }

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword)
  }

  return (
    <main className="auth">
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
        <div className="auth__form">
          {/* Mobile brand mark (visible on small/medium screens where aside is hidden) */}
          <div className="auth__mobile-brand">
            <img
              src="/blue-logo-wellfind.png"
              alt="Wellfind Academic"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <span className="font-semibold text-base text-foreground tracking-tight">
              Wellfind Academic
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Join Wellfind Academic in minutes.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field>
              <Label htmlFor="regName">Full name</Label>
              <InputGroup size="lg">
                <InputGroupText>
                  <User className="w-5 h-5" aria-hidden="true" />
                </InputGroupText>
                <Input
                  type="text"
                  id="regName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                />
              </InputGroup>
            </Field>

            <Field>
              <Label htmlFor="regEmail">Email</Label>
              <InputGroup size="lg">
                <InputGroupText>
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </InputGroupText>
                <Input
                  type="email"
                  id="regEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wellfind.academy"
                  autoComplete="email"
                  required
                />
              </InputGroup>
            </Field>

            <Field>
              <Label htmlFor="regPassword">Password</Label>
              <InputGroup size="lg">
                <InputGroupText>
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </InputGroupText>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="regPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="input-group__text"
                  onClick={handlePasswordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </InputGroup>
              <p className="field__description">At least 8 characters.</p>
            </Field>

            <Field className="field--checkbox">
              <input
                type="checkbox"
                id="regTerms"
                className="field__checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                required
              />
              <Label htmlFor="regTerms" className="field__label">
                I agree to the Terms and Privacy Policy
              </Label>
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="button--block"
              loading={isLoading}
            >
              Create account
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="link">Sign in</Link>
          </p>
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
            <img
              src="/blue-logo-wellfind.png"
              alt="Wellfind Academic"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </span>
          <span className="auth__brand-text">
            <span className="auth__brand-name">Wellfind Academic</span>
          </span>
        </Link>
        <div className="auth__pitch">
          <h2 className="auth__pitch-title">Managed <span>Education Network</span></h2>
          <p className="auth__pitch-lede">
            Student enquiries, teacher applications, and tutor mapping — all managed from one calm
            dashboard.
          </p>
        </div>
      </aside>
    </main>
  )
}