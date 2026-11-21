import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

/** `can('students')` = may view; `can('students', 'write')` = may change. Super admins can do everything. */
export function usePermissions() {
  const { user } = useAuth()
  const can = useCallback(
    (module, level = 'read') => {
      if (!user) return false
      if (user.role === 'super_admin') return true
      const have = user.permissions?.[module]
      if (!have) return false
      return level === 'read' ? true : have === 'write'
    },
    [user],
  )
  return { can, role: user?.role }
}
