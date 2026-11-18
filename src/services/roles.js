/** Single source of truth for role → home route. Add `student` here when that portal exists. */
export const ROLE_HOME = {
  super_admin: '/admin',
  teacher: '/teacher',
}

export const homeForRole = (role) => ROLE_HOME[role] || null
