import { PageLoader } from '@/components/ui/Loaders'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, ClipboardCheck, FileText, GraduationCap, IndianRupee, RefreshCw,
  Upload, UserRound, Users,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Notice } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { getMyApplication } from '@/services/teacherPortalService'
import TeacherOverview from './TeacherOverview'
import RegistrationRenewalCard from './RegistrationRenewalCard'
import { buildSteps, progressPercent } from './teacherApplicationUtils'

function nextAction(app) {
  const docsDone = [app.documents.aadhaar, app.documents.qualification].filter((d) => d.uploaded).length
  const fee = app.registrationFee.status
  if (app.rejected) return { title: 'Application closed', text: 'Please contact the Wellfind team if you have any questions.', cta: null }
  if (app.approved) return { title: 'You are approved', text: 'Your teacher profile is active. Check your students and fees from the shortcuts below.', cta: null }
  if (['shortlisted', 'evaluation_completed'].includes(app.status) && fee === 'pending') {
    return { title: 'Pay the registration fee', text: `You are shortlisted. Pay the ₹${Number(app.registrationFee.amount).toLocaleString('en-IN')} registration fee to move to approval.`, cta: { to: '/teacher/application', label: 'Go to payment' } }
  }
  if (fee === 'submitted') return { title: 'Payment is being verified', text: 'We received your payment details and will confirm shortly.', cta: { to: '/teacher/application', label: 'View status' } }
  if (docsDone < 2) return { title: 'Upload your documents', text: `${docsDone} of 2 documents uploaded. Add your Aadhaar and degree certificate so we can verify your profile.`, cta: { to: '/teacher/application#documents', label: 'Upload documents' } }
  return { title: 'Your application is under review', text: 'Our team is reviewing your profile. We will contact you with the next steps.', cta: { to: '/teacher/application', label: 'View status' } }
}

function Stat({ icon: Icon, label, value, note, tone = 'primary' }) {
  return (
    <div className="wf-stat-card">
      <span className={`wf-stat-card__icon is-${tone}`}><Icon size={20} /></span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {note && <span>{note}</span>}
      </div>
    </div>
  )
}

/** Teacher "Dashboard" tab: where the application stands, shortcuts and basic analytics. */
export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data: app, loading, error, reload } = useLoad(getMyApplication, [])

  if (loading && !app) {
    return <PageLoader label="Loading your dashboard…" />
  }

  const name = app?.fullName || (user?.email ? user.email.split('@')[0] : 'Teacher')
  const docsDone = app ? [app.documents.aadhaar, app.documents.qualification].filter((d) => d.uploaded).length : 0
  const steps = app ? buildSteps(app) : []
  const action = app ? nextAction(app) : null
  const feeLabel = { pending: 'Pending', submitted: 'Verifying', paid: 'Paid', waived: 'Skipped' }[app?.registrationFee.status] || '—'
  const stageNow = steps.find((s) => s.state === 'active')?.label || (app?.approved ? 'Approved' : '—')

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Welcome, {name}</h1>
          <p className="page__description">{app ? `${app.primarySubject} · ${app.teachingLocality}` : 'Wellfind Academic Teacher Portal'}</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={reload}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
        </div>
      </header>

      <Notice error={error} />

      {app && (
        <>
          <div className="wf-stat-grid">
            <Stat icon={ClipboardCheck} label="Application stage" value={stageNow} note={app.approved ? 'All steps complete' : `${steps.filter((s) => s.state === 'done').length} of ${steps.length} steps done`} />
            <Stat icon={CheckCircle2} label="Progress" value={`${progressPercent(app)}%`} note="Towards approval" tone="success" />
            <Stat icon={FileText} label="Documents" value={`${docsDone} / 2`} note={docsDone === 2 ? 'All uploaded' : 'Upload pending'} tone="info" />
            <Stat icon={IndianRupee} label="Registration fee" value={feeLabel} note={`₹${Number(app.registrationFee.amount).toLocaleString('en-IN')} per year`} tone={['paid', 'waived'].includes(app.registrationFee.status) ? 'success' : 'warning'} />
          </div>

          <RegistrationRenewalCard app={app} onDone={reload} onSuccess={() => {}} onError={() => {}} />

          <Card variant="hover">
            <div className="wf-next">
              <div>
                <small>Next step</small>
                <h3>{action.title}</h3>
                <p>{action.text}</p>
                <div className="wf-progressbar" aria-label={`Progress ${progressPercent(app)}%`}><span style={{ width: `${progressPercent(app)}%` }} /></div>
              </div>
              {action.cta && (
                <Link to={action.cta.to} className="button button--primary">
                  {action.cta.label}<ArrowRight size={16} style={{ marginLeft: 8 }} />
                </Link>
              )}
            </div>
          </Card>

          <div>
            <h3 className="wf-sectiontitle">Shortcuts</h3>
            <div className="wf-shortcuts">
              <Link to="/teacher/application" className="wf-shortcut"><ClipboardCheck size={20} /><b>Application status</b><span>Track every step</span></Link>
              <Link to="/teacher/application#documents" className="wf-shortcut"><Upload size={20} /><b>Upload documents</b><span>{docsDone} of 2 uploaded</span></Link>
              {app.payment.canPay && <Link to="/teacher/application" className="wf-shortcut is-hot"><IndianRupee size={20} /><b>Pay registration fee</b><span>Valid for 1 year</span></Link>}
              {app.approved && <Link to="/teacher/students" className="wf-shortcut"><Users size={20} /><b>My students</b><span>Allocations and responses</span></Link>}
              {app.approved && <Link to="/teacher/fees" className="wf-shortcut"><GraduationCap size={20} /><b>Fees &amp; history</b><span>Registration and payouts</span></Link>}
              {app.approved && <Link to="/teacher/profile" className="wf-shortcut"><UserRound size={20} /><b>My profile</b><span>Your details</span></Link>}
            </div>
          </div>

          {app.approved && app.hasProfile && (
            <div>
              <h3 className="wf-sectiontitle">Teaching overview</h3>
              <TeacherOverview hideHeader />
            </div>
          )}
        </>
      )}
    </div>
  )
}
