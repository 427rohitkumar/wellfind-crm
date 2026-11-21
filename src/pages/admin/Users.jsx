import { TableLoader } from '@/components/ui/Loaders'
import { useCallback, useState } from 'react'
import { KeyRound, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import {
  USER_ROLES, USER_STATUSES, blockUser, createUser, deleteUser, docsOf, fmtDateTime,
  listUsers, reactivateUser, resetUserPassword, suspendUser, unblockUser, updateUser,
} from '@/services/adminApi'
import { getAuthUser } from '@/services/apiClient'
import { FormRow, Modal, Notice, Pager, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'
import { ROLE_LABELS, ROLE_SUMMARY, STAFF_ROLES } from '@/services/roles'

export default function Users() {
  const me = getAuthUser()
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [modal, setModal] = useState(null) // {type:'create'|'edit'|'password', user?, password?}
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useLoad(
    () => listUsers({ page, limit: 10, role, status, search: query }),
    [page, role, status, query],
  )
  const users = docsOf(data)

  const run = async (id, fn, okMsg) => {
    setBusyId(id)
    setMsg({ error: '', success: '' })
    try {
      const res = await fn()
      setMsg({ error: '', success: okMsg })
      await reload()
      return res
    } catch (e) {
      setMsg({ error: e.message, success: '' })
    } finally {
      setBusyId(null)
    }
  }

  const onReset = async (u) => {
    if (!window.confirm(`Generate a temporary password for ${u.email}?`)) return
    const res = await run(u.id, () => resetUserPassword(u.id), 'Password reset.')
    const pw = res?.temporaryPassword || res?.tempPassword || res?.password
    setModal({ type: 'password', user: u, password: pw, raw: pw ? null : res })
  }

  const onDelete = (u) => {
    if (!window.confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return
    run(u.id, () => deleteUser(u.id), 'User deleted.')
  }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">User Management</h1>
          <p className="page__description">Create admin/teacher accounts, block or suspend access, reset passwords.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={reload}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
          <Button onClick={() => setModal({ type: 'create' })}><Plus size={16} style={{ marginRight: 8 }} />New user</Button>
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <Card>
        <div className="wf-sectionhead" style={{ flexWrap: 'wrap' }}>
          <div><h3>Accounts</h3><p>{data ? `${data.totalDocs} total` : 'Loading…'}</p></div>
          <div className="wf-filterbar">
            <form className="wf-searchbox" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }}>
              <Search size={14} />
              <input className={inputCls} placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <select className={inputCls} style={{ width: 150 }} value={role} onChange={(e) => { setPage(1); setRole(e.target.value) }} aria-label="Role">
              <option value="all">All roles</option>
              {USER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
            </select>
            <select className={inputCls} style={{ width: 150 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} aria-label="Status">
              <option value="all">All statuses</option>
              {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th className="num">Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ padding: 0 }}><TableLoader columns={5} /></td></tr>}
              {!loading && error && <tr><td colSpan={5} className="wf-state is-error">{error}</td></tr>}
              {!loading && !error && users.length === 0 && (
                <tr><td colSpan={5} className="wf-state">No users found.</td></tr>
              )}
              {!loading && users.map((u) => {
                const self = me && String(me.id) === String(u.id)
                const busy = busyId === u.id
                return (
                  <tr key={u.id}>
                    <td className="wf-cell-title">{u.email}{self && <span className="wf-chip" style={{ marginLeft: 8 }}>you</span>}</td>
                    <td><span className={`wf-chip${u.role === 'teacher' ? '' : ' wf-chip--staff'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(u.createdAt)}</td>
                    <td>
                      <div className="wf-actions" style={{ justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => setModal({ type: 'edit', user: u })}>Edit</Button>
                        {!self && u.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(u.id, () => suspendUser(u.id), 'User suspended.')}>Suspend</Button>
                            <Button size="sm" variant="danger" disabled={busy} onClick={() => run(u.id, () => blockUser(u.id), 'User blocked.')}>Block</Button>
                          </>
                        )}
                        {u.status === 'suspended' && (
                          <Button size="sm" variant="success" disabled={busy} onClick={() => run(u.id, () => reactivateUser(u.id), 'User reactivated.')}>Reactivate</Button>
                        )}
                        {u.status === 'blocked' && (
                          <Button size="sm" variant="success" disabled={busy} onClick={() => run(u.id, () => unblockUser(u.id), 'User unblocked.')}>Unblock</Button>
                        )}
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => onReset(u)} title="Reset password"><KeyRound size={14} /></Button>
                        {!self && <Button size="sm" variant="danger" disabled={busy} onClick={() => onDelete(u)} title="Delete"><Trash2 size={14} /></Button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pager data={data} page={page} onPage={setPage} />
      </Card>

      <Card>
        <div className="wf-sectionhead"><div><h3>Roles &amp; access</h3><p>What each staff role can open. Create an account with the role that matches the person&apos;s job.</p></div></div>
        <div className="wf-rolelist">
          {['super_admin', ...STAFF_ROLES].map((r) => (
            <div key={r}><b>{ROLE_LABELS[r]}</b><span>{ROLE_SUMMARY[r]}</span></div>
          ))}
        </div>
      </Card>

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <UserForm
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={(text) => { setModal(null); setMsg({ error: '', success: text }); reload() }}
        />
      )}
      {modal?.type === 'password' && (
        <Modal title="Temporary password" description={modal.user.email} onClose={() => setModal(null)}>
          {modal.password ? (
            <>
              <p className="wf-muted">Shown only once. Share it securely with the user.</p>
              <code className="wf-callout" style={{ fontSize: 16, userSelect: "all" }}>{modal.password}</code>
            </>
          ) : (
            <p className="wf-muted">Password reset completed. The server did not return a password value.</p>
          )}
          <div className="wf-formfoot"><Button onClick={() => setModal(null)}>Done</Button></div>
        </Modal>
      )}
    </div>
  )
}

function UserForm({ user, onClose, onSaved }) {
  const editing = Boolean(user)
  const [form, setForm] = useState({
    email: user?.email || '', password: '', role: user?.role || 'teacher', status: user?.status || 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    if (!editing && form.password.length < 8) return setError('Password must be at least 8 characters.')
    setSaving(true)
    try {
      if (editing) {
        await updateUser(user.id, { email: form.email.trim(), role: form.role, status: form.status })
        onSaved('User updated.')
      } else {
        await createUser({ ...form, email: form.email.trim() })
        onSaved('User created.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [editing, form, onSaved, user])

  return (
    <Modal title={editing ? 'Edit user' : 'New user'} onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <FormRow label="Email"><input required type="email" className={inputCls} value={form.email} onChange={set('email')} /></FormRow>
        {!editing && (
          <FormRow label="Password" hint="Minimum 8 characters.">
            <input required type="password" minLength={8} className={inputCls} value={form.password} onChange={set('password')} autoComplete="new-password" />
          </FormRow>
        )}
        <div className="wf-grid-2">
          <FormRow label="Role">
            <select className={inputCls} value={form.role} onChange={set('role')}>
              <optgroup label="Admin side (CRM staff)">
                <option value="super_admin">{ROLE_LABELS.super_admin}</option>
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </optgroup>
              <optgroup label="Teacher portal"><option value="teacher">{ROLE_LABELS.teacher}</option></optgroup>
            </select>
          </FormRow>
          <FormRow label="Status">
            <select className={inputCls} value={form.status} onChange={set('status')}>{USER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </FormRow>
        </div>
        <div className="wf-callout"><b>{ROLE_LABELS[form.role] || form.role}</b><span>{ROLE_SUMMARY[form.role] || 'Signs in to the teacher portal.'}</span></div>
        <div className="wf-formfoot">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{editing ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  )
}
