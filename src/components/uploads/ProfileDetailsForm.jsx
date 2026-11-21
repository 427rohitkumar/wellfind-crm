import { useEffect, useState } from 'react'
import { Lock, Save } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { FormRow, Notice } from '@/pages/admin/adminUi'
import { inputCls } from '@/pages/admin/useLoad'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/services/profileService'

const GENDERS = [['male', 'Male'], ['female', 'Female'], ['other', 'Other']]

/**
 * Editable basic details for the signed-in user. The email is shown but locked (it is the login).
 * `profile` comes from GET /api/profile; teachers also get locality, availability, class levels and about.
 */
export function ProfileDetailsForm({ profile, onSaved }) {
  const { token, user, setSession } = useAuth()
  const teacher = profile?.role === 'teacher' && profile?.teacher
  const [form, setForm] = useState({ name: '', phone: '', gender: '', locality: '', availability: '', classLevels: '', about: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ error: '', success: '' })

  useEffect(() => {
    if (!profile) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      locality: profile.teacher?.locality || '',
      availability: profile.teacher?.availability || '',
      classLevels: profile.teacher?.classLevels || '',
      about: profile.teacher?.about || '',
    })
  }, [profile])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setMsg({ error: '', success: '' })
    if (!form.name.trim()) return setMsg({ error: 'Please enter your name.', success: '' })
    setSaving(true)
    try {
      const body = { name: form.name, phone: form.phone, gender: form.gender || null }
      if (teacher) Object.assign(body, { locality: form.locality, availability: form.availability, classLevels: form.classLevels, about: form.about })
      const res = await updateProfile(body)
      if (user) setSession(token, { ...user, name: res.name, phone: res.phone, avatar: res.avatar ?? user.avatar })
      setMsg({ error: '', success: 'Profile updated.' })
      onSaved?.(res)
    } catch (err) {
      setMsg({ error: err.message || 'Could not save your profile.', success: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <div className="wf-cardhead"><h3>Basic details</h3></div>
      <form className="wf-testpad" onSubmit={save}>
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
        <div className="wf-grid-2">
          <FormRow label="Full name"><input className={inputCls} maxLength={100} value={form.name} onChange={set('name')} /></FormRow>
          <FormRow label="Phone number" hint="7-15 digits, optional leading +"><input className={inputCls} type="tel" maxLength={20} value={form.phone} onChange={set('phone')} /></FormRow>
        </div>
        <div className="wf-grid-2">
          <FormRow label="Email (login)" hint="Your email is your login, so it cannot be changed here.">
            <div className="wf-locked"><Lock size={14} /><span>{profile?.email || user?.email}</span></div>
          </FormRow>
          <FormRow label="Gender">
            <select className={inputCls} value={form.gender} onChange={set('gender')}>
              <option value="">Prefer not to say</option>
              {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormRow>
        </div>
        {teacher && (
          <>
            <div className="wf-grid-2">
              <FormRow label="Teaching locality"><input className={inputCls} maxLength={200} value={form.locality} onChange={set('locality')} /></FormRow>
              <FormRow label="Availability"><input className={inputCls} maxLength={200} value={form.availability} onChange={set('availability')} placeholder="e.g. Weekday evenings" /></FormRow>
            </div>
            <FormRow label="Class levels you teach"><input className={inputCls} maxLength={200} value={form.classLevels} onChange={set('classLevels')} placeholder="e.g. Class 6 to 10" /></FormRow>
            <FormRow label="About you" hint="A short introduction (up to 1000 characters).">
              <textarea className={inputCls} rows={4} maxLength={1000} value={form.about} onChange={set('about')} />
            </FormRow>
            <p className="wf-muted" style={{ margin: 0 }}>Qualification, subject and experience were verified at approval. To change them, contact the Wellfind team.</p>
          </>
        )}
        <div><Button type="submit" loading={saving}><Save size={15} style={{ marginRight: 6 }} />Save changes</Button></div>
      </form>
    </Card>
  )
}
