import { Link } from 'react-router-dom'
import { Briefcase, GraduationCap, KeyRound, LogOut, Mail, MapPin, Phone } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Notice, StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { getMyProfile } from '@/services/teacherPortalService'
import { formatDate } from './teacherPortalUtils'

export default function TeacherProfile() {
  const { user, logout } = useAuth()
  const { data: p, loading, error } = useLoad(getMyProfile, [])

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

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">My Profile</h1>
          <p className="page__description">Your teacher account and profile as registered with Wellfind Academic.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={() => logout()}><LogOut size={16} className="mr-2" />Log out</Button>
        </div>
      </header>

      <Notice error={error} />
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {p && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
              <h3 className="card__title">{p.name}</h3>
              <div className="flex gap-2">
                <StatusBadge status={p.approvalStatus} />
                <Badge size="sm" variant={p.availabilityStatus === 'free' ? 'success' : 'warning'}>{p.availabilityStatus}</Badge>
              </div>
            </CardHeader>
            <CardBody className="p-5 grid gap-4 sm:grid-cols-2 text-sm">
              {fields.map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={16} className="mt-0.5 text-muted-foreground shrink-0" />
                  <div><div className="text-muted-foreground">{label}</div><div className="font-medium">{value || '—'}</div></div>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">Account</h3></CardHeader>
              <CardBody className="p-5 text-sm space-y-3">
                <div><span className="text-muted-foreground">Login email</span><div className="font-medium break-all">{user?.email}</div></div>
                <div><span className="text-muted-foreground">Member since</span><div className="font-medium">{formatDate(p.approvedAt || p.createdAt)}</div></div>
                <div><span className="text-muted-foreground">KYC</span><div><StatusBadge status={p.kycStatus} /></div></div>
                <Link to="/forgot-password" className="button button--outline button--sm w-full">
                  <KeyRound size={14} className="mr-2" />Change password via OTP
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
