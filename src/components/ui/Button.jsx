import { Spinner } from './Loaders'
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
      {loading && <Spinner size={16} className="-ml-1 mr-2" />}
      {children}
    </Component>
  )
}