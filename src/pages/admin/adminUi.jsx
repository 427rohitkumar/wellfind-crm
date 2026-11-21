import { Alert } from '@/components/ui/Alert'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui'

export function Notice({ error, success, onClose }) {
  if (!error && !success) return null
  return <Alert variant={error ? 'error' : 'success'} title={error || success} onClose={onClose} className="mb-4" />
}

export function Modal({ title, description, onClose, children, wide = false }) {
  return (
    <div
      className="payments-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="payments-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={wide ? { maxWidth: 760, width: '100%' } : undefined}
      >
        <header className="payments-modal__header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="payments-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="wf-modal-body">{children}</div>
      </section>
    </div>
  )
}

export function FormRow({ label, hint, children }) {
  return (
    <label className="wf-field">
      <span className="wf-field__label">{label}</span>
      {children}
      {hint && <span className="wf-field__hint">{hint}</span>}
    </label>
  )
}

const STATUS_VARIANT = {
  active: 'success', accepted: 'success', approved: 'success', completed: 'success', paid: 'success',
  eligible: 'info', assigned: 'info', shortlisted: 'primary', scheduled: 'info', tester_assigned: 'info',
  report_available: 'success',
  pending: 'warning', payment_pending: 'warning', paused: 'warning', in_progress: 'warning', inactive: 'neutral',
  blocked: 'danger', suspended: 'danger', rejected: 'danger', cancelled: 'neutral', failed: 'danger',
}

export function StatusBadge({ status }) {
  if (!status) return <Badge size="sm">—</Badge>
  return (
    <Badge size="sm" variant={STATUS_VARIANT[status] || 'neutral'}>
      {String(status).replace(/_/g, ' ')}
    </Badge>
  )
}

export function Pager({ data, page, onPage }) {
  if (!data || (data.totalPages || 1) <= 1) return null
  return (
    <div className="wf-pager">
      <span>Page {data.page} of {data.totalPages} · {data.totalDocs} total</span>
      <div className="wf-actions">
        <button className="button button--outline button--sm" disabled={!data.hasPrevPage} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="button button--outline button--sm" disabled={!data.hasNextPage} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}
