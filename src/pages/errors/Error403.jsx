import { Link } from 'react-router-dom'
import { ShieldAlert, LayoutDashboard, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function Error403() {
  const { user } = useAuth()
  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/admin'

  return (
    <div className="error-card" role="region" aria-labelledby="error-403-title">
      <div className="error-card__icon-wrapper error-card__icon-wrapper--warning" aria-hidden="true">
        <ShieldAlert className="error-card__icon" />
      </div>

      <div className="error-card__badge">403</div>

      <h1 id="error-403-title" className="error-card__title">
        Access denied
      </h1>

      <p className="error-card__description">
        You don't have permission to view this page. Ask an administrator if you believe this is a mistake.
      </p>

      <div className="error-card__actions">
        <Button
          as={Link}
          to={dashboardPath}
          variant="primary"
          className="error-card__btn-primary"
        >
          <LayoutDashboard className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
          <span>Back to Dashboard</span>
        </Button>

        <Button
          as={Link}
          to="/"
          variant="outline"
          color="neutral"
          className="error-card__btn-secondary"
        >
          <LogIn className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
          <span>Switch account</span>
        </Button>
      </div>
    </div>
  )
}
