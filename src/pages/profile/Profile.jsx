import { Mail, ShieldCheck, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import { AvatarUploader } from '@/components/uploads/AvatarUploader'
import { ProfileDetailsForm } from '@/components/uploads/ProfileDetailsForm'
import { useAuth } from '@/hooks/useAuth'
import { useLoad } from '@/pages/admin/useLoad'
import { getProfile } from '@/services/profileService'

/** The signed-in admin's own profile: photo, account details and personal documents. */
export default function Profile() {
  const { user } = useAuth()
  const { data: profile, reload } = useLoad(getProfile, [])
  const name = profile?.name || user?.name || (user?.email || 'Admin').split('@')[0]

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">My Profile</h1>
          <p className="page__description">Your photo and basic details.</p>
        </div>
      </header>

      <div className="wf-portal-grid">
        <div className="wf-portal-main">
          <Card>
            <div className="wf-cardhead"><h3>Profile photo</h3></div>
            <div className="wf-testpad"><AvatarUploader name={name} gender={profile?.gender} role="teacher" avatar={profile?.avatar} /></div>
          </Card>
          <ProfileDetailsForm profile={profile} onSaved={reload} />
        </div>
        <div className="wf-portal-side">
          <Card>
            <div className="wf-cardhead"><h3><ShieldCheck size={18} />Account</h3></div>
            <dl className="wf-info">
              <div><dt>Email</dt><dd><Mail size={14} />{user?.email}</dd></div>
              <div><dt>Phone</dt><dd>{profile?.phone || <span className="is-empty">Not added</span>}</dd></div>
              <div><dt>Role</dt><dd>{user?.role === 'super_admin' ? 'Super admin' : user?.role}</dd></div>
              <div><dt>Status</dt><dd>{user?.status || 'active'}</dd></div>
            </dl>
            <div className="wf-testpad" style={{ paddingTop: 0 }}>
              <Link to="/forgot-password" className="button button--outline button--sm"><KeyRound size={14} style={{ marginRight: 6 }} />Change password via OTP</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
