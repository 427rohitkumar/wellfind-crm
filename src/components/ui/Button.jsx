import { clsx } from 'clsx'

export function Button({
  children,
  variant = 'primary',
  color = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  as: Component = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    primary: 'button button--primary',
    secondary: 'button button--secondary',
    outline: 'button button--outline',
    ghost: 'button button--ghost',
    neutral: 'button button--neutral',
    danger: 'button button--danger',
    success: 'button button--success',
    warning: 'button button--warning',
    info: 'button button--info',
  }

  const colors = {
    primary: '',
    secondary: '',
    neutral: 'button--neutral',
    danger: 'button--danger',
    success: 'button--success',
    warning: 'button--warning',
    info: 'button--info',
  }

  const sizes = {
    sm: 'button--sm',
    md: '',
    lg: 'button--lg',
    xl: 'button--xl',
    icon: 'button--icon',
  }

  const variantClass = variants[variant] || variants.primary
  const colorClass = colors[color] || ''

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={clsx(baseStyles, variantClass, colorClass, sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </Component>
  )
}