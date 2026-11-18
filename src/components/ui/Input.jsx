import { clsx } from 'clsx'
import { forwardRef, useId } from 'react'

export const Input = forwardRef(function Input({
  className = '',
  type = 'text',
  disabled = false,
  error = false,
  success = false,
  ...props
}, ref) {
  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={clsx(
        'input field__input flex-1 min-w-0 w-full bg-transparent text-foreground border-0 outline-none focus:outline-none focus:ring-0',
        {
          'input--error field__input--error': error,
          'input--success field__input--success': success,
        },
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export function InputGroup({ children, className = '', variant = 'default', size = 'default', ...props }) {
  const variants = {
    default: 'input-group',
    search: 'input-group input-group--search',
  }
  const sizes = {
    default: '',
    sm: 'input-group--sm',
    lg: 'input-group--lg',
  }

  return (
    <div
      className={clsx(
        variants[variant] || variants.default,
        sizes[size] || (size ? `input-group--${size}` : ''),
        'flex items-center w-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function InputGroupText({ children, className = '', ...props }) {
  return (
    <span className={clsx('input-group__text flex items-center justify-center shrink-0', className)} {...props}>
      {children}
    </span>
  )
}

export function Textarea({ className = '', disabled = false, error = false, success = false, ...props }) {
  return (
    <textarea
      disabled={disabled}
      className={clsx('input field__input field__input--textarea', {
        'input--error field__input--error': error,
        'input--success field__input--success': success,
      }, className)}
      {...props}
    />
  )
}

export function Select({ className = '', disabled = false, error = false, success = false, ...props }) {
  return (
    <select
      disabled={disabled}
      className={clsx('select field__input field__input--select', {
        'select--error field__input--error': error,
        'select--success field__input--success': success,
      }, className)}
      {...props}
    />
  )
}

export function Label({ children, className = '', htmlFor, required = false, ...props }) {
  return (
    <label className={clsx('field__label', className)} htmlFor={htmlFor} {...props}>
      {children}
      {required && <span className="field__required" aria-hidden="true">*</span>}
    </label>
  )
}

export function Field({ children, className = '', label, error, hint, required = false, ...props }) {
  return (
    <div className={clsx('field w-full', className)} {...props}>
      {label && <Label htmlFor={props.id} required={required}>{label}</Label>}
      {children}
      {error && <p className="field__error" role="alert">{error}</p>}
      {hint && !error && <p className="field__hint">{hint}</p>}
    </div>
  )
}

export function Checkbox({ className = '', label, id, ...props }) {
  const generatedId = useId()
  const checkboxId = id || generatedId
  
  return (
    <div className={clsx('field field--checkbox', className)}>
      <input type="checkbox" id={checkboxId} className="field__checkbox" {...props} />
      {label && <Label htmlFor={checkboxId} className="field__label">{label}</Label>}
    </div>
  )
}

export function Radio({ className = '', label, id, name, value, ...props }) {
  const generatedId = useId()
  const radioId = id || generatedId
  
  return (
    <div className={clsx('field field--radio', className)}>
      <input type="radio" id={radioId} name={name} value={value} className="field__radio" {...props} />
      {label && <Label htmlFor={radioId} className="field__label">{label}</Label>}
    </div>
  )
}

export function RadioGroup({ children, className = '', ...props }) {
  return (
    <div className={clsx('field field--radio-group', className)} role="radiogroup" {...props}>
      {children}
    </div>
  )
}
