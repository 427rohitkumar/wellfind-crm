import { clsx } from 'clsx'
import {
  AlertCircle, AlertTriangle, CheckCircle2, CreditCard, FileText, Info, KeyRound, Mail, PlugZap, ShieldAlert, X,
} from 'lucide-react'

/**
 * Wellfind alert banner (success / error / warning / info), following the alertBanner.html design:
 * a soft tinted box, thin border, a line icon on the left, a bold title and an optional description.
 * If no icon is passed, one is chosen from the wording so the icon matches what the message is about.
 */
const VARIANT_ICON = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info }

const TOPIC_ICONS = [
  [/razorpay|payment|paid|fee\b|refund|payout|₹|invoice|billing|webhook/i, CreditCard],
  [/e-?mail|smtp|inbox|mail\b/i, Mail],
  [/password|login|sign in|credential|account|otp|token|session|unauthori[sz]ed|forbidden|permission|access/i, KeyRound],
  [/document|file|upload|certificate|aadhaar|kyc/i, FileText],
  [/api key|invalid key|connect|connection|network|server|backend|timeout|unreachable/i, PlugZap],
  [/blocked|suspend|security|denied|rejected/i, ShieldAlert],
]

function pickIcon(variant, text) {
  // Success keeps the check mark: it always reads as "done".
  if (variant === 'success') return VARIANT_ICON.success
  const hit = TOPIC_ICONS.find(([re]) => re.test(text))
  if (hit && variant === 'warning') return hit[1]
  if (hit && variant === 'error' && hit[1] !== CreditCard) return hit[1]
  return VARIANT_ICON[variant] || Info
}

const textOf = (node) =>
  typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join(' ') : node?.props?.children ? textOf(node.props.children) : ''

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
  role,
  ...rest
}) {
  const Icon = icon || pickIcon(variant, `${textOf(title)} ${textOf(children)}`)
  return (
    <div
      className={clsx('wf-ban', `wf-ban--${variant}`, className)}
      role={role || (variant === 'error' ? 'alert' : 'status')}
      {...rest}
    >
      <Icon className="wf-ban__icon" size={20} strokeWidth={1.8} aria-hidden="true" />
      <div className="wf-ban__body">
        {title && <div className="wf-ban__title">{title}</div>}
        {children && <div className="wf-ban__text">{children}</div>}
      </div>
      {onClose && (
        <button type="button" className="wf-ban__close" onClick={onClose} aria-label="Dismiss">
          <X size={15} />
        </button>
      )}
    </div>
  )
}
