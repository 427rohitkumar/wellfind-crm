import { Badge } from '@/components/ui'
import { STUDENT_STATUS_CONFIG } from './studentsSampleData'

export function StudentStatusBadge({ status, size = 'sm', dot = true, className = '' }) {
  const config = STUDENT_STATUS_CONFIG[status] || {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active',
    variant: 'neutral',
  }

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  )
}

