export const fmtWhen = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export const STATUS_VARIANT = { requested: 'warning', scheduled: 'info', conducted: 'primary', report_ready: 'success', cancelled: 'neutral' }
export const PAY_VARIANT = { pending: 'warning', paid: 'success', waived: 'info' }
