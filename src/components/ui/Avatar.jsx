import { clsx } from 'clsx'

export function Avatar({ src, alt = '', name, size = 'md', shape = 'circle', className = '', ...props }) {
  const sizes = {
    xs: 'avatar--xs',
    sm: 'avatar--sm',
    md: '',
    lg: 'avatar--lg',
    xl: 'avatar--xl',
    '2xl': 'avatar--2xl',
  }

  const shapes = {
    circle: 'avatar--circle',
    square: 'avatar--square',
    rounded: '',
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorFromName = (name) => {
    if (!name) return 'var(--color-primary)'
    const colors = [
      'var(--color-primary)',
      'var(--color-success)',
      'var(--color-warning)',
      'var(--color-danger)',
      'var(--color-info)',
      'var(--color-accent)',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const bgColor = name ? getColorFromName(name) : 'var(--color-muted-foreground)'

  return (
    <span
      className={clsx('avatar', sizes[size], shapes[shape], className)}
      style={{ '--avatar-bg': bgColor }}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="avatar__image" />
      ) : (
        <span className="avatar__fallback" aria-hidden="true">
          {name ? getInitials(name) : '?'}
        </span>
      )}
    </span>
  )
}

export function AvatarGroup({ children, className = '', max = 5, ...props }) {
  const childrenArray = Array.isArray(children) ? children : [children]
  const visibleChildren = childrenArray.slice(0, max)
  const remainingCount = childrenArray.length - max

  return (
    <div className={clsx('avatar-group', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="avatar-group__item" style={{ zIndex: max - index }}>
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="avatar-group__more" style={{ zIndex: 0 }}>
          +{remainingCount}
        </span>
      )}
    </div>
  )
}