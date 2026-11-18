import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Badge } from '@/components/ui'

export function Notice({ error, success, onClose }) {
  if (!error && !success) return null
  const isErr = Boolean(error)
  return (
    <div
      role={isErr ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm mb-4 ${
        isErr ? 'border-danger/30 bg-danger/5 text-danger' : 'border-success/30 bg-success/5 text-success'
      }`}
    >
      <span className="flex items-center gap-2">
        {isErr ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        {error || success}
      </span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  )
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
        <div className="p-5 space-y-4">{children}</div>
      </section>
    </div>
  )
}

export function FormRow({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-xs text-muted-foreground">{hint}</span>}
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
    <div className="flex items-center justify-between px-5 py-3 text-sm border-t border-border">
      <span className="text-muted-foreground">
        Page {data.page} of {data.totalPages} · {data.totalDocs} total
      </span>
      <div className="flex gap-2">
        <button className="button button--outline button--sm" disabled={!data.hasPrevPage} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className="button button--outline button--sm" disabled={!data.hasNextPage} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

