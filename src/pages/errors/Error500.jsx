import { Link } from 'react-router-dom'
import { AlertTriangle, LayoutDashboard, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function Error500() {
  const { user } = useAuth()
  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/admin'

  return (
    <div className="error-card" role="region" aria-labelledby="error-500-title">
      <div className="error-card__icon-wrapper error-card__icon-wrapper--danger" aria-hidden="true">
        <AlertTriangle className="error-card__icon" />
      </div>

      <div className="error-card__badge">500</div>

      <h1 id="error-500-title" className="error-card__title">
        Server error
      </h1>

      <p className="error-card__description">
        Something went wrong on our end. Please try again or return to the dashboard.
      </p>

      <div className="error-card__actions">
        <Button
          as={Link}
          to={dashboardPath}
          variant="primary"
          className="error-card__btn-primary"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to Dashboard
        </Button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="error-card__btn-secondary"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  )
}
