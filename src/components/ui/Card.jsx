import { clsx } from 'clsx'

export function Card({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'card',
    bordered: 'card card--bordered',
    hover: 'card card--hover',
    'hover-bordered': 'card card--hover card--bordered',
  }

  return (
    <div className={clsx(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'card__header',
    alt: 'card__header card__header--alt',
    flex: 'card__header flex-wrap',
    'flex-alt': 'card__header card__header--alt flex-wrap',
  }

  return (
    <div className={clsx(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={clsx('card__body', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={clsx('card__footer', className)} {...props}>
      {children}
    </div>
  )
}