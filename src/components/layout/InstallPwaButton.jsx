import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export function InstallPwaButton({ collapsed = false }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already running in standalone PWA window
    if (
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && navigator.standalone)
    ) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (isInstalled) return null

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert(
        'To install Wellfind CRM on your desktop:\n\n1. Look at your browser address bar (top right)\n2. Click the "Install" icon (desktop monitor with down arrow)\n3. Click "Install"\n\nOr open Chrome / Edge menu (⋮) > "Install Wellfind Academic CRM".'
      )
      return
    }
    installPrompt.prompt()
    try {
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
    } catch {
      // ignore
    }
    setInstallPrompt(null)
  }

  return (
    <li className="sidebar__item" role="none">
      <button
        type="button"
        className="sidebar__button w-full text-left cursor-pointer"
        role="menuitem"
        onClick={handleInstallClick}
        title="Install Desktop App"
        style={{ color: '#00897B' }}
      >
        <Download className="sidebar__icon" style={{ strokeWidth: 2.2, color: '#00897B' }} />
        {!collapsed && <span style={{ fontWeight: 600 }}>Install Desktop App</span>}
      </button>
    </li>
  )
}
