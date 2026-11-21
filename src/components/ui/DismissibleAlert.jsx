import PropTypes from 'prop-types'
import { Alert } from './Alert'

/**
 * DismissibleAlert: kept for existing callers; renders the shared Wellfind Alert banner.
 * Supports info, success, warning and error states, optional actions and a dismiss button.
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
  className = '',
}) {
  const t = variant || type
  const v = t === 'danger' || t === 'error' ? 'error' : t
  return (
    <Alert variant={v} title={title} onClose={dismissible ? onDismiss : undefined} className={className}>
      {children || message}
      {actions && <div style={{ marginTop: 8 }}>{actions}</div>}
    </Alert>
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
