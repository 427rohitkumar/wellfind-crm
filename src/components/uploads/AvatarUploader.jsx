import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Notice } from '@/pages/admin/adminUi'
import { useAuth } from '@/hooks/useAuth'
import { AVATAR_ACCEPT, MAX_AVATAR_MB, checkFile, removeAvatar, uploadAvatar } from '@/services/uploadService'

/** Round profile photo with Change / Remove. Works for admins and teachers (same endpoint). */
export function AvatarUploader({ name, gender, role = 'student', avatar, onChanged }) {
  const { token, user, setSession } = useAuth()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const current = avatar ?? user?.avatar ?? null

  const apply = (url, text) => {
    if (user) setSession(token, { ...user, avatar: url })
    onChanged?.(url)
    setMsg({ error: '', success: text })
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = checkFile(file, 'avatar')
    if (problem) return setMsg({ error: problem, success: '' })
    setBusy('upload')
    setMsg({ error: '', success: '' })
    try {
      const res = await uploadAvatar(file)
      apply(res.avatar, 'Profile photo updated.')
    } catch (err) {
      setMsg({ error: err.message || 'Could not upload the photo.', success: '' })
    } finally {
      setBusy('')
    }
  }

  const remove = async () => {
    setBusy('remove')
    setMsg({ error: '', success: '' })
    try {
      await removeAvatar()
      apply(null, 'Profile photo removed.')
    } catch (err) {
      setMsg({ error: err.message || 'Could not remove the photo.', success: '' })
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="wf-avatarup">
      <PersonAvatar src={current} name={name} gender={gender} role={role} size={96} />
      <div className="wf-avatarup__body">
        <div className="wf-actions">
          <input ref={inputRef} type="file" accept={AVATAR_ACCEPT} onChange={pick} hidden />
          <Button size="sm" loading={busy === 'upload'} onClick={() => inputRef.current?.click()}>
            <Camera size={14} style={{ marginRight: 6 }} />{current ? 'Change photo' : 'Upload photo'}
          </Button>
          {current && <Button size="sm" variant="outline" loading={busy === 'remove'} onClick={remove}><Trash2 size={14} style={{ marginRight: 6 }} />Remove</Button>}
        </div>
        <p className="wf-muted" style={{ margin: '8px 0 0' }}>JPG, PNG or WebP, up to {MAX_AVATAR_MB} MB.</p>
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
      </div>
    </div>
  )
}
