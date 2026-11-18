import { useCallback, useState } from 'react'
import { KeyRound, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Button, Card, CardBody } from '@/components/ui'
import {
  USER_ROLES, USER_STATUSES, blockUser, createUser, deleteUser, docsOf, fmtDateTime,
  listUsers, reactivateUser, resetUserPassword, suspendUser, unblockUser, updateUser,
} from '@/services/adminApi'
import { getAuthUser } from '@/services/apiClient'
import { FormRow, Modal, Notice, Pager, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

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
        <div className="page__action flex gap-2">
          <Button variant="outline" onClick={reload}><RefreshCw size={16} className="mr-2" />Refresh</Button>
          <Button onClick={() => setModal({ type: 'create' })}><Plus size={16} className="mr-2" />New user</Button>
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <Card>
        <CardBody className="p-4 flex flex-wrap gap-3 items-end">
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }}
          >
            <input className={inputCls} placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" variant="outline"><Search size={16} /></Button>
          </form>
          <select className={inputCls} style={{ width: 160 }} value={role} onChange={(e) => { setPage(1); setRole(e.target.value) }}>
            <option value="all">All roles</option>
            {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={inputCls} style={{ width: 160 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
            <option value="all">All statuses</option>
            {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </CardBody>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-y border-border">
                <th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && error && <tr><td colSpan={5} className="px-5 py-8 text-center text-danger">{error}</td></tr>}
              {!loading && !error && users.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No users found.</td></tr>
              )}
              {!loading && users.map((u) => {
                const self = me && String(me.id) === String(u.id)
                const busy = busyId === u.id
                return (
                  <tr key={u.id} className="border-b border-border">
                    <td className="px-5 py-3 font-medium">{u.email}{self && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</td>
                    <td className="px-5 py-3">{u.role}</td>
                    <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-3">{fmtDateTime(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5 justify-end flex-wrap">
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
              <p className="text-sm">Shown only once. Share it securely with the user.</p>
              <code className="block rounded-md bg-surface-2 border border-border px-3 py-2 text-base select-all">{modal.password}</code>
            </>
          ) : (
            <p className="text-sm">Password reset completed. The server did not return a password value.</p>
          )}
          <div className="flex justify-end"><Button onClick={() => setModal(null)}>Done</Button></div>
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
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        <FormRow label="Email"><input required type="email" className={inputCls} value={form.email} onChange={set('email')} /></FormRow>
        {!editing && (
          <FormRow label="Password" hint="Minimum 8 characters.">
            <input required type="password" minLength={8} className={inputCls} value={form.password} onChange={set('password')} autoComplete="new-password" />
          </FormRow>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Role">
            <select className={inputCls} value={form.role} onChange={set('role')}>{USER_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          </FormRow>
          <FormRow label="Status">
            <select className={inputCls} value={form.status} onChange={set('status')}>{USER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </FormRow>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{editing ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  )
}
