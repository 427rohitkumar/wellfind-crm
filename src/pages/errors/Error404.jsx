import { Link } from 'react-router-dom'
import { Search, LayoutDashboard, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function Error404() {
  const { user } = useAuth()
  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/admin'

  return (
    <div className="error-card" role="region" aria-labelledby="error-404-title">
      <div className="error-card__icon-wrapper" aria-hidden="true">
        <Search className="error-card__icon" />
      </div>

      <div className="error-card__badge">404</div>

      <h1 id="error-404-title" className="error-card__title">
        Page not found
      </h1>

      <p className="error-card__description">
        The page you're looking for doesn't exist or may have moved.
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
          as="a"
          href="mailto:admin@wellfind.academy?subject=Wellfind%20CRM%20Support%20-%20Page%20Not%20Found"
          variant="outline"
          color="neutral"
          className="error-card__btn-secondary"
          title="Email Wellfind Academic Support"
          aria-label="Contact Support via Email"
        >
          <Mail className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
          <span>Contact Support</span>
        </Button>
      </div>
    </div>
  )
}
