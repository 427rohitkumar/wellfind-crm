import { clsx } from 'clsx'
import { forwardRef, useId } from 'react'

export const Toggle = forwardRef(function Toggle({
  className = '',
  checked = false,
  defaultChecked = false,
  disabled = false,
  size = 'md',
  label,
  description,
  onChange,
  ...props
}, ref) {
  const toggleId = useId()
  const labelId = `${toggleId}-label`
  const descriptionId = `${toggleId}-description`

  const sizes = {
    sm: 'toggle--sm',
    md: '',
    lg: 'toggle--lg',
  }

  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked, e)
    }
  }

  return (
    <div className={clsx('toggle-wrapper', className)}>
      <label htmlFor={toggleId} className="toggle__label">
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          className={clsx('toggle__input', sizes[size])}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={handleChange}
          aria-describedby={description ? descriptionId : undefined}
          {...props}
        />
        <span className={clsx('toggle__track', sizes[size])}>
          <span className={clsx('toggle__thumb', sizes[size])} aria-hidden="true" />
        </span>
      </label>
      {label && (
        <span id={labelId} className="toggle__text">
          {label}
        </span>
      )}
      {description && (
        <p id={descriptionId} className="toggle__description">
          {description}
        </p>
      )}
    </div>
  )
})

Toggle.displayName = 'Toggle'

export function ToggleGroup({ children, className = '', name, value, onChange, ...props }) {
  return (
    <div className={clsx('toggle-group', className)} role="group" aria-label={name} {...props}>
      {children}
    </div>
  )
}

export function ToggleItem({ children, className = '', value, disabled = false, ...props }) {
  const isActive = props.checked === value || props.defaultChecked === value
  
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-disabled={disabled}
      className={clsx('toggle-item', {
        'toggle-item--active': isActive,
        'toggle-item--disabled': disabled,
      }, className)}
      disabled={disabled}
      onClick={() => !disabled && props.onChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}