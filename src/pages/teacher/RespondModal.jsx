import { useState } from 'react'
import { Button } from '@/components/ui'
import { FormRow, Modal, Notice } from '@/pages/admin/adminUi'
import { inputCls } from '@/pages/admin/useLoad'
import { respondToAllocation } from '@/services/teacherPortalService'

/** Accept or reject a new allocation, with an optional note / reason. */
export function RespondModal({ row, status, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await respondToAllocation(row.id, status, reason.trim())
      onDone(`Allocation ${status}.`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }
  return (
    <Modal title={`${status === 'accepted' ? 'Accept' : 'Reject'} allocation`} description={`${row.student?.name} · ${row.subject}`} onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <FormRow label={status === 'rejected' ? 'Reason (recommended)' : 'Note (optional)'}>
          <textarea className={inputCls} rows={3} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormRow>
        <div className="wf-formfoot">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={status === 'accepted' ? 'success' : 'danger'} loading={saving}>Confirm {status === 'accepted' ? 'accept' : 'reject'}</Button>
        </div>
      </form>
    </Modal>
  )
}
