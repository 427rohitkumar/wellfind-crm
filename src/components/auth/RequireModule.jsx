import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'

/** Renders the page only when the signed-in role may use that module; otherwise shows the 403 page. */
export function RequireModule({ module, anyOf, level = 'read', children }) {
  const { can } = usePermissions()
  const allowed = (anyOf || [module]).some((m) => can(m, level))
  return allowed ? children : <Navigate to="/403" replace />
}
