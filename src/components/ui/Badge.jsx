import { clsx } from 'clsx'

export function Badge({ children, variant = 'neutral', size = 'md', className = '', dot = false, ...props }) {
  const variants = {
    primary: 'badge badge--primary',
    secondary: 'badge badge--secondary',
    success: 'badge badge--success',
    warning: 'badge badge--warning',
    danger: 'badge badge--danger',
    info: 'badge badge--info',
    neutral: 'badge badge--neutral',
    outline: 'badge badge--outline',
  }

  const sizes = {
    sm: 'badge--sm',
    md: '',
    lg: 'badge--lg',
  }

  return (
    <span className={clsx(variants[variant], sizes[size], className)} {...props}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}