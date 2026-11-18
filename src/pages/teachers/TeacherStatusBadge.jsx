import { Badge } from '@/components/ui'
import {
  REGISTRATION_FEE_CONFIG,
  KYC_CONFIG,
  ALLOCATION_CONFIG,
  ACCOUNT_CONFIG,
} from './teachersSampleData'

export function TeacherStatusBadge({ type, value, size = 'sm', dot = true, className = '' }) {
  let config

  switch (type) {
    case 'fee':
    case 'registrationFee':
      config = REGISTRATION_FEE_CONFIG[value] || { label: value || 'Pending', variant: 'neutral' }
      break
    case 'kyc':
      config = KYC_CONFIG[value] || { label: value || 'Pending', variant: 'neutral' }
      break
    case 'allocation':
    case 'studentAllocation':
      config = ALLOCATION_CONFIG[value] || { label: value || 'Unallocated', variant: 'neutral' }
      break
    case 'account':
      config = ACCOUNT_CONFIG[value] || { label: value || 'Active', variant: 'neutral' }
      break
    default:
      config = { label: value || 'Unknown', variant: 'neutral' }
  }

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  )
}
