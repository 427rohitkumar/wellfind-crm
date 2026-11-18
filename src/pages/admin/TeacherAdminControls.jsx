import { useState } from 'react'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import { TEACHER_PROFILE_STATUSES, resetUserPassword, setTeacherAvailability, setTeacherStatus, updateUser } from '@/services/adminApi'
import { FormRow, Notice } from './adminUi'
import { inputCls } from './useLoad'

/** Status + availability controls for an approved teacher profile. */
export default function TeacherAdminControls({ teacherId, userId, loginEmail, status = 'active', availability = '', availabilityStatus = 'free', onChanged }) {
  const [st, setSt] = useState(status)
  const [text, setText] = useState(availability === 'Flexible' ? '' : availability)
  const [avSt, setAvSt] = useState(availabilityStatus)
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [busy, setBusy] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [issued, setIssued] = useState('')

  const run = async (key, fn, ok) => {
    setBusy(key)
    setMsg({ error: '', success: '' })
    try {
      await fn()
      setMsg({ error: '', success: ok })
      onChanged?.()
    } catch (e) {
      setMsg({ error: e.message, success: '' })
    } finally {
      setBusy('')
    }
  }

  return (
    <Card variant="hover">
      <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">Admin controls</h3></CardHeader>
      <CardBody className="p-5 space-y-4">
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
        <FormRow label="Account / operational status" hint="Suspended also blocks the teacher's login.">
          <div className="flex gap-2">
            <select className={inputCls} value={st} onChange={(e) => setSt(e.target.value)}>{TEACHER_PROFILE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            <Button size="sm" loading={busy === 'status'} disabled={st === status} onClick={() => run('status', () => setTeacherStatus(teacherId, st), 'Status updated.')}>Save</Button>
          </div>
        </FormRow>
        <FormRow label="Availability">
          <div className="space-y-2">
            <input className={inputCls} maxLength={200} placeholder="e.g. Weekdays 5–8 PM" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex gap-2">
              <select className={inputCls} value={avSt} onChange={(e) => setAvSt(e.target.value)}><option value="free">free</option><option value="allocated">allocated</option></select>
              <Button size="sm" loading={busy === 'avail'} onClick={() => run('avail', () => setTeacherAvailability(teacherId, { availabilityStatus: avSt, ...(text.trim() ? { availability: text.trim() } : {}) }), 'Availability updated.')}>Save</Button>
            </div>
          </div>
        </FormRow>
        <div className="border-t border-border pt-4 space-y-3">
          <span className="block text-sm font-medium">Teacher login credentials</span>
          {!userId ? (
            <p className="text-xs text-muted-foreground">No login account is linked yet. Approve the application first (or create a teacher user under Users with the same email, then approve).</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Login email: <strong>{loginEmail || '—'}</strong>. Share the password with the teacher; they can change it any time via “Forgot password”.
              </p>
              <div className="flex gap-2">
                <input type="text" autoComplete="off" className={inputCls} minLength={8} placeholder="Set password (min 8 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Button size="sm" loading={busy === 'pw'} disabled={newPassword.length < 8}
                  onClick={() => run('pw', async () => { await updateUser(userId, { password: newPassword }); setIssued(newPassword); setNewPassword('') }, 'Password set. Share it with the teacher securely.')}>Set</Button>
              </div>
              <Button size="sm" variant="outline" loading={busy === 'gen'}
                onClick={() => { if (window.confirm('Generate a new temporary password? The old password will stop working.')) run('gen', async () => { const r = await resetUserPassword(userId); setIssued(r?.temporaryPassword || '') }, 'Temporary password generated.') }}>
                Generate temporary password
              </Button>
              {issued && (
                <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                  <div className="text-xs text-muted-foreground">Shown once — copy it now</div>
                  <code className="select-all">{issued}</code>
                </div>
              )}
            </>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
