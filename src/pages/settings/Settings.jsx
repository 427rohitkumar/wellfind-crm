import { useState } from 'react'
import { User, Bell, Shield, Trash2, Camera, Save, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Field, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/Dialog'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'danger', label: 'Danger zone', icon: Trash2 },
]

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
]

const appearances = [
  { value: 'system', label: 'System', description: 'Match your system setting' },
  { value: 'light', label: 'Light', description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', description: 'Always use dark mode' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Profile form state
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    timezone: 'America/New_York',
    language: 'en',
    appearance: 'system',
  })

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
    securityAlerts: true,
    productUpdates: true,
  })

  // Security state
  const [security, setSecurity] = useState({
    passwordEnabled: true,
    googleEnabled: true,
    githubEnabled: false,
    twoFactorEnabled: false,
    passkeysEnabled: false,
  })

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleNotificationChange = (name, checked) => {
    setNotifications(prev => ({ ...prev, [name]: checked }))
  }

  const handleSecurityChange = (name, checked) => {
    setSecurity(prev => ({ ...prev, [name]: checked }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // In a real app, you would save to backend here
  }

  const renderTabPanel = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Manage your profile information and preferences.</p>
              </div>
              <Card>
                <div className="card__body">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={avatarPreview || '/assets/hero.png'}
                      alt="Profile"
                      name="John Doe"
                      size="xl"
                      className="relative"
                    />
                    <label htmlFor="avatar-upload" className="button button--outline button--sm cursor-pointer">
                      <Camera className="w-4 h-4 mr-1" aria-hidden="true" />
                      Change avatar
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-12 gap-4 mt-6">
                    <div className="col-span-12 sm:col-span-6">
                      <Field label="First name" required>
                        <Input
                          name="firstName"
                          value={profile.firstName}
                          onChange={handleProfileChange}
                          placeholder="John"
                        />
                      </Field>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <Field label="Last name" required>
                        <Input
                          name="lastName"
                          value={profile.lastName}
                          onChange={handleProfileChange}
                          placeholder="Doe"
                        />
                      </Field>
                    </div>
                    <div className="col-span-12">
                      <Field label="Email address" required>
                        <Input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleProfileChange}
                          placeholder="john.doe@example.com"
                        />
                      </Field>
                    </div>
                    <div className="col-span-12">
                      <Field label="Timezone">
                        <Select
                          name="timezone"
                          value={profile.timezone}
                          onChange={handleProfileChange}
                        >
                          {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    <div className="col-span-12">
                      <Field label="Language">
                        <Select
                          name="language"
                          value={profile.language}
                          onChange={handleProfileChange}
                        >
                          {languages.map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                    <div className="col-span-12">
                      <Field label="Appearance">
                        <Select
                          name="appearance"
                          value={profile.appearance}
                          onChange={handleProfileChange}
                        >
                          {appearances.map(app => (
                            <option key={app.value} value={app.value}>{app.label}</option>
                          ))}
                        </Select>
                        <p className="field__hint">This will override your system preference.</p>
                      </Field>
                    </div>
                    <div className="col-span-12 flex justify-end mt-2">
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                            Save changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        )

      case 'notifications':
        return (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Configure how you receive notifications.</p>
            </div>
            <Card>
              <ul className="list-group list-group--seamless">
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Email notifications</h3>
                    <p className="media__text text-sm">Receive email notifications for account activity.</p>
                  </div>
                  <div className="media__action">
                    <Toggle
                      checked={notifications.emailNotifications}
                      onChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>
                </li>
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Push notifications</h3>
                    <p className="media__text text-sm">Receive push notifications in your browser.</p>
                  </div>
                  <div className="media__action">
                    <Toggle
                      checked={notifications.pushNotifications}
                      onChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                    />
                  </div>
                </li>
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Weekly digest</h3>
                    <p className="media__text text-sm">Receive a weekly summary of your activity.</p>
                  </div>
                  <div className="media__action">
                    <Toggle
                      checked={notifications.weeklyDigest}
                      onChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
                    />
                  </div>
                </li>
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Marketing emails</h3>
                    <p className="media__text text-sm">Receive emails about new features and promotions.</p>
                  </div>
                  <div className="media__action">
                    <Toggle
                      checked={notifications.marketingEmails}
                      onChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                    />
                  </div>
                </li>
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Security alerts</h3>
                    <p className="media__text text-sm">Receive alerts for suspicious account activity.</p>
                  </div>
                  <div className="media__action">
                    <Toggle
                      checked={notifications.securityAlerts}
                      onChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                    />
                  </div>
                </li>
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Product updates</h3>
                    <p className="media__text text-sm">Receive emails about product updates and new features.</p>
                  </div>
                  <div className="media__action">
                    <Toggle
                      checked={notifications.productUpdates}
                      onChange={(checked) => handleNotificationChange('productUpdates', checked)}
                    />
                  </div>
                </li>
              </ul>
            </Card>
          </section>
        )

      case 'security':
        return (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Login methods</h2>
                <p className="text-sm text-muted-foreground">Manage how you sign in to your account.</p>
              </div>
              <Card>
                <ul className="list-group list-group--seamless">
                  <li className="media">
                    <span className="media__figure">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <div className="media__content">
                      <h3 className="media__title">Password</h3>
                      <p className="media__text text-sm">Sign in with your email and password.</p>
                    </div>
                    <div className="media__action">
                      <Toggle
                        checked={security.passwordEnabled}
                        onChange={(checked) => handleSecurityChange('passwordEnabled', checked)}
                        disabled
                      />
                    </div>
                  </li>
                  <li className="media">
                    <span className="media__figure">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </span>
                    <div className="media__content">
                      <h3 className="media__title">Google</h3>
                      <p className="media__text text-sm">Sign in with your Google account.</p>
                    </div>
                    <div className="media__action">
                      <Toggle
                        checked={security.googleEnabled}
                        onChange={(checked) => handleSecurityChange('googleEnabled', checked)}
                      />
                    </div>
                  </li>
                  <li className="media">
                    <span className="media__figure">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                    </span>
                    <div className="media__content">
                      <h3 className="media__title">GitHub</h3>
                      <p className="media__text text-sm">Sign in with your GitHub account.</p>
                    </div>
                    <div className="media__action">
                      <Toggle
                        checked={security.githubEnabled}
                        onChange={(checked) => handleSecurityChange('githubEnabled', checked)}
                      />
                    </div>
                  </li>
                </ul>
              </Card>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Two-factor authentication</h2>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Card>
                <ul className="list-group list-group--seamless">
                  <li className="media">
                    <span className="media__figure">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <div className="media__content">
                      <h3 className="media__title">Authenticator app</h3>
                      <p className="media__text text-sm">Use an authenticator app to generate verification codes.</p>
                    </div>
                    <div className="media__action">
                      <Button variant="outline" size="sm" disabled={!security.twoFactorEnabled}>
                        {security.twoFactorEnabled ? 'Configured' : 'Set up'}
                      </Button>
                    </div>
                  </li>
                  <li className="media">
                    <div className="media__content">
                      <h3 className="media__title">Enable 2FA</h3>
                      <p className="media__text text-sm">Require a verification code when signing in.</p>
                    </div>
                    <div className="media__action">
                      <Toggle
                        checked={security.twoFactorEnabled}
                        onChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                      />
                    </div>
                  </li>
                </ul>
              </Card>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Passkeys</h2>
                <p className="text-sm text-muted-foreground">Use your device's biometrics or PIN to sign in.</p>
              </div>
              <Card>
                <ul className="list-group list-group--seamless">
                  <li className="media">
                    <span className="media__figure">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <div className="media__content">
                      <h3 className="media__title">Passkeys</h3>
                      <p className="media__text text-sm">Sign in with Face ID, Touch ID, or your device PIN.</p>
                    </div>
                    <div className="media__action">
                      <Button variant="outline" size="sm" disabled={!security.passkeysEnabled}>
                        {security.passkeysEnabled ? 'Manage' : 'Add passkey'}
                      </Button>
                    </div>
                  </li>
                  <li className="media">
                    <div className="media__content">
                      <h3 className="media__title">Enable passkeys</h3>
                      <p className="media__text text-sm">Allow signing in with passkeys.</p>
                    </div>
                    <div className="media__action">
                      <Toggle
                        checked={security.passkeysEnabled}
                        onChange={(checked) => handleSecurityChange('passkeysEnabled', checked)}
                      />
                    </div>
                  </li>
                </ul>
              </Card>
            </section>
          </div>
        )

      case 'danger':
        return (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Danger zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible and destructive actions.</p>
            </div>
            <Card>
              <ul className="list-group list-group--seamless">
                <li className="media">
                  <div className="media__content">
                    <h3 className="media__title">Delete account</h3>
                    <p className="media__text text-sm">Permanently delete your account and all associated data.</p>
                  </div>
                  <div className="media__action">
                    <Dialog defaultOpen={false} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="danger" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
                          Delete account
                        </Button>
                      </DialogTrigger>
                      <DialogContent size="sm">
                        <DialogHeader
                          title="Delete account"
                          description="Are you absolutely sure? This action cannot be undone."
                          action={<DialogClose />}
                        />
                        <DialogBody className="text-center pt-6">
                          <span className="icon-box icon-box--danger icon-box--circle icon-box--lg mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                          <h3 className="text-lg font-semibold mb-2">Delete your account?</h3>
                          <p className="text-muted-foreground mb-6">
                            This will permanently delete your account, all your data, and remove you from any organizations.
                            This action cannot be undone.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please type <strong>"DELETE"</strong> to confirm.
                          </p>
                          <Input
                            type="text"
                            placeholder="Type DELETE to confirm"
                            className="max-w-xs mx-auto mt-4"
                            onChange={(e) => e.target.value === 'DELETE' && setDeleteDialogOpen(false)}
                          />
                        </DialogBody>
                        <DialogFooter justify="center">
                          <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                          <Button variant="danger" disabled={true}>Delete account</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </li>
              </ul>
            </Card>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb__item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb__item" aria-current="page">
                Settings
              </li>
            </ol>
          </nav>
          <h1 className="page__title">Settings</h1>
          <p className="page__description">Configure your application preferences.</p>
        </div>
      </header>
      <div className="page__body">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <aside className="sidebar sidebar--setting" aria-label="Settings sections">
              <div className="sidebar__content">
                <nav className="sidebar__menu">
                  <div className="sidebar__group">
                    <ul className="sidebar__list">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                          <li key={tab.id} className="sidebar__item">
                            <button
                              type="button"
                              className={`sidebar__button ${isActive ? 'sidebar__button--active' : ''}`}
                              onClick={() => setActiveTab(tab.id)}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <Icon className="w-5 h-5" aria-hidden="true" />
                              <span>{tab.label}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </nav>
              </div>
              <footer className="sidebar__footer">
                <ul className="sidebar__list">
                  <li className="sidebar__item">
                    <a href="/settings" className="sidebar__button">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Help center</span>
                    </a>
                  </li>
                </ul>
              </footer>
            </aside>
          </div>
          <div className="col-span-12 lg:col-span-9">
            <div className="tabs" id="settingsTabs" data-stisla-tabs>
              {renderTabPanel()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}