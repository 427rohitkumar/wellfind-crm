import { Link } from 'react-router-dom'
import { Briefcase, GraduationCap, KeyRound, LogOut, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { PageLoader } from '@/components/ui/Loaders'
import { useAuth } from '@/hooks/useAuth'
import { Notice, StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { getMyProfile } from '@/services/teacherPortalService'
import { getProfile } from '@/services/profileService'
import { ProfileDetailsForm } from '@/components/uploads/ProfileDetailsForm'
import { AvatarUploader } from '@/components/uploads/AvatarUploader'
import { MyDocuments } from '@/components/uploads/MyDocuments'
import { formatDate } from './teacherPortalUtils'

/** Teacher "My Profile": photo, basic details (editable), verified details (read-only) and personal documents. */
export default function TeacherProfile() {
  const { user, logout } = useAuth()
  const { data: p, loading, error, reload } = useLoad(getMyProfile, [])
  const editable = useLoad(getProfile, [])

  const fields = p && [
    [Mail, 'Email', p.email || user?.email],
    [Phone, 'Mobile', p.mobile],
    [GraduationCap, 'Qualification', p.qualification],
    [Briefcase, 'Experience', `${p.experienceYears ?? 0} year(s)`],
    [GraduationCap, 'Primary subject', p.primarySubject],
    [GraduationCap, 'Class levels', p.classLevels],
    [MapPin, 'Teaching locality', p.locality],
    [Briefcase, 'Availability', p.availability],
  ]

  if (loading && !p) return <PageLoader label="Loading your profile…" />

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">My Profile</h1>
          <p className="page__description">Your photo, details and documents as registered with Wellfind Academic.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={() => logout()}><LogOut size={16} style={{ marginRight: 8 }} />Log out</Button>
        </div>
      </header>

      <Notice error={error} />

      {p && (
        <div className="wf-portal-grid">
          {/* Main column: what the teacher edits */}
          <div className="wf-portal-main">
            <ProfileDetailsForm profile={editable.data} onSaved={() => { reload(); editable.reload() }} />
            <MyDocuments />
          </div>

          {/* Side column: photo, verified info, account */}
          <div className="wf-portal-side">
            <Card>
              <div className="wf-cardhead"><h3><UserRound size={18} />Profile photo</h3></div>
              <div className="wf-testpad"><AvatarUploader name={p.name} gender={p.gender} role="teacher" avatar={p.avatar} /></div>
            </Card>

            <Card>
              <div className="wf-cardhead">
                <h3><ShieldCheck size={18} />{p.name}</h3>
                <div className="wf-actions">
                  <StatusBadge status={p.approvalStatus} />
                  <Badge size="sm" variant={p.availabilityStatus === 'free' ? 'success' : 'warning'}>{p.availabilityStatus}</Badge>
                </div>
              </div>
              <dl className="wf-info">
                {fields.map(([Icon, label, value]) => (
                  <div key={label}><dt>{label}</dt><dd><Icon size={14} />{value || <span className="is-empty">—</span>}</dd></div>
                ))}
              </dl>
            </Card>

            <Card>
              <div className="wf-cardhead"><h3>Account</h3></div>
              <dl className="wf-info">
                <div><dt>Login email</dt><dd>{user?.email}</dd></div>
                <div><dt>Member since</dt><dd>{formatDate(p.approvedAt || p.createdAt)}</dd></div>
                <div><dt>KYC</dt><dd><StatusBadge status={p.kycStatus} /></dd></div>
              </dl>
              <div className="wf-testpad" style={{ paddingTop: 0 }}>
                <Link to="/forgot-password" className="button button--outline button--sm"><KeyRound size={14} style={{ marginRight: 6 }} />Change password via OTP</Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
