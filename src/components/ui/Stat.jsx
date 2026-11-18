import { clsx } from 'clsx'

export function Stat({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) {
  const variants = {
    default: 'stat',
    primary: 'stat stat--primary',
    success: 'stat stat--success',
    warning: 'stat stat--warning',
    danger: 'stat stat--danger',
    info: 'stat stat--info',
  }

  return (
    <div className={clsx(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

export function StatIcon({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'stat__icon stat__icon--primary',
    success: 'stat__icon stat__icon--success',
    warning: 'stat__icon stat__icon--warning',
    danger: 'stat__icon stat__icon--danger',
    info: 'stat__icon stat__icon--info',
    neutral: 'stat__icon stat__icon--neutral',
  }

  const sizes = {
    sm: 'stat__icon--sm',
    md: '',
    lg: 'stat__icon--lg',
  }

  return (
    <div className={clsx(variants[variant], sizes[size], className)} {...props}>
      {children}
    </div>
  )
}

export function StatContent({ children, className = '', ...props }) {
  return (
    <div className={clsx('stat__content', className)} {...props}>
      {children}
    </div>
  )
}

export function StatValue({ children, className = '', prefix, suffix, ...props }) {
  return (
    <div className={clsx('stat__value', className)} {...props}>
      {prefix && <span className="stat__prefix">{prefix}</span>}
      {children}
      {suffix && <span className="stat__suffix">{suffix}</span>}
    </div>
  )
}

export function StatLabel({ children, className = '', ...props }) {
  return (
    <div className={clsx('stat__label', className)} {...props}>
      {children}
    </div>
  )
}

export function StatChange({ 
  children, 
  className = '', 
  trend = 'neutral', 
  period,
  icon = true,
  ...props 
}) {
  const trends = {
    up: 'stat__change stat__change--up',
    down: 'stat__change stat__change--down',
    neutral: 'stat__change stat__change--neutral',
  }

  return (
    <div className={clsx(trends[trend], className)} {...props}>
      {icon && (
        <span className="stat__change-icon" aria-hidden="true">
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
        </span>
      )}
      <span className="stat__change-value">{children}</span>
      {period && <span className="stat__change-period">{period}</span>}
    </div>
  )
}

export function StatChart({ children, className = '', ...props }) {
  return (
    <div className={clsx('stat__chart', className)} {...props}>
      {children}
    </div>
  )
}