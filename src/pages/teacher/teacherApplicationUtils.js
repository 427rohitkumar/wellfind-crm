export function formatDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** First time the application reached `status`, from the status history. */
function reachedAt(app, status) {
  return app.history?.find((h) => h.to === status)?.at || null
}

/**
 * Stepper model for the teacher: Under review, Shortlisted, Registration payment, Approved.
 * state: done | active | idle | blocked
 */
export function buildSteps(app) {
  const s = app.status
  const feeStatus = app.registrationFee?.status
  const feeDone = feeStatus === 'paid' || feeStatus === 'waived'
  const shortlisted = ['shortlisted', 'evaluation_completed', 'approved'].includes(s)
  const approved = s === 'approved'
  const rejected = s === 'rejected'

  return [
    {
      key: 'under_review',
      label: 'Under review',
      note: 'Our team reviews your profile and contacts you.',
      state: shortlisted ? 'done' : rejected ? 'blocked' : 'active',
      at: reachedAt(app, 'under_review') || app.submittedAt,
    },
    {
      key: 'shortlisted',
      label: 'Shortlisted',
      note: shortlisted ? 'You are shortlisted for the next steps.' : 'Shortlisting is decided after the review.',
      state: shortlisted ? 'done' : 'idle',
      at: reachedAt(app, 'shortlisted'),
    },
    {
      key: 'payment',
      label: 'Registration payment',
      note: feeStatus === 'waived'
        ? 'Fee skipped for your application.'
        : feeStatus === 'paid'
          ? 'Registration fee received.'
          : feeStatus === 'submitted'
            ? 'Payment submitted. Verification pending.'
            : shortlisted
              ? 'Pay the registration fee (valid for 1 year) to continue.'
              : 'Opens after you are shortlisted.',
      state: feeDone && shortlisted ? 'done' : shortlisted && !rejected ? 'active' : 'idle',
      at: feeDone ? app.registrationFee.paidAt : app.registrationFee?.submittedAt || null,
    },
    {
      key: 'approved',
      label: 'Approved',
      note: approved ? 'Welcome aboard! Your teacher profile is active.' : 'Final approval by the Wellfind team.',
      state: approved ? 'done' : shortlisted && feeDone && !rejected ? 'active' : 'idle',
      at: reachedAt(app, 'approved'),
    },
  ]
}

/** 0-100 progress through the four steps. */
export function progressPercent(app) {
  const steps = buildSteps(app)
  const done = steps.filter((st) => st.state === 'done').length
  return Math.round((done / steps.length) * 100)
}
