import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react'

/**
 * DismissibleAlert
 * Reusable banner supporting info, success, warning, and error states.
 * Includes accessible dismiss button (X) and optional custom actions.
 */
export function DismissibleAlert({
  type = 'info',
  variant,
  title,
  message,
  children,
  actions,
  onDismiss,
  dismissible = true,
  dismissLabel = 'Dismiss notification',
  className = '',
}) {
  const alertType = variant || type

  const normalizedType = useMemo(() => {
    if (alertType === 'error' || alertType === 'danger') return 'danger'
    if (alertType === 'warning') return 'warning'
    if (alertType === 'success') return 'success'
    return 'info'
  }, [alertType])

  const iconNode = useMemo(() => {
    switch (normalizedType) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
      case 'info':
      default:
        return <Info className="w-4 h-4 text-info shrink-0" aria-hidden="true" />
    }
  }, [normalizedType])

  return (
    <div
      role="alert"
      className={`alert alert--${normalizedType} dismissible-alert ${className}`}
    >
      <div className="dismissible-alert__body">
        {iconNode}
        <div className="dismissible-alert__text">
          {title && (
            <strong className="dismissible-alert__title font-semibold text-foreground mr-1.5">
              {title}
            </strong>
          )}
          <span className="dismissible-alert__message">{children || message}</span>
        </div>
      </div>

      <div className="dismissible-alert__actions">
        {actions}
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="dismissible-alert__close"
            aria-label={dismissLabel}
            title={dismissLabel}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

DismissibleAlert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error', 'danger']),
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error', 'danger']),
  title: PropTypes.node,
  message: PropTypes.node,
  children: PropTypes.node,
  actions: PropTypes.node,
  onDismiss: PropTypes.func,
  dismissible: PropTypes.bool,
  dismissLabel: PropTypes.string,
  className: PropTypes.string,
}

