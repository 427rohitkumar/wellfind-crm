import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Spinner } from '@/components/ui/Loaders'
import { useRegistrationCheckout } from './useRegistrationCheckout'

const longDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

const TONE = {
  active: { label: 'Active', badge: 'paid', icon: CheckCircle2, cls: 'is-ok' },
  expiring: { label: 'Renew soon', badge: 'pending', icon: Clock, cls: 'is-wait' },
  expired: { label: 'Expired', badge: 'failed', icon: AlertTriangle, cls: 'is-bad' },
}

/**
 * Yearly registration for approved teachers: when it is valid until, and a Renew button that
 * opens inside the renewal window or after expiry. Renewal is required every year, also while teaching.
 */
export default function RegistrationRenewalCard({ app, onDone, onSuccess, onError }) {
  const reg = app.registration
  const { paying, pay } = useRegistrationCheckout({ onSuccess, onError, onDone })
  if (!app.approved || !reg?.validUntil || !reg.state) return null

  const tone = TONE[reg.state]
  const Icon = tone.icon
  const amount = `₹${Number(app.registrationFee.amount || 1000).toLocaleString('en-IN')}`
  const online = app.payment.online?.enabled
  const left = reg.daysLeft

  return (
    <Card variant="hover">
      <div className="wf-cardhead">
        <h3><CalendarCheck size={18} />Registration validity</h3>
        <span className={`wf-feebadge wf-feebadge--${tone.badge}`}>{tone.label}</span>
      </div>
      <div className="wf-feebody">
        <div className={`wf-paystate ${tone.cls}`}>
          <Icon size={20} />
          <div>
            <b>
              {reg.state === 'expired'
                ? `Expired on ${longDate(reg.validUntil)}`
                : `Valid until ${longDate(reg.validUntil)}`}
            </b>
            <span>
              {reg.state === 'expired'
                ? `Your registration expired ${Math.abs(left)} day${Math.abs(left) === 1 ? '' : 's'} ago. Please renew now to keep it active.`
                : reg.state === 'expiring'
                  ? `${left} day${left === 1 ? '' : 's'} left. Renew before the date so there is no gap.`
                  : `${left} days left. We will remind you before it expires.`}
            </span>
          </div>
        </div>

        {reg.canRenew && (
          online ? (
            <>
              <Button onClick={pay} disabled={paying || !app.payment.canPay} className="w-full">
                {paying ? <><Spinner size={16} className="mr-2" />Opening payment…</> : <><RefreshCw size={15} style={{ marginRight: 8 }} />Renew for 1 year ({amount})</>}
              </Button>
              <p className="wf-muted" style={{ margin: 0, textAlign: 'center' }}>
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
                Secure payment via Razorpay. Your validity extends automatically after payment.
              </p>
            </>
          ) : (
            <div className="wf-paystate"><Loader2 size={20} /><div><b>Online renewal coming soon</b><span>Renewal payment will open here shortly. We will email you when it does.</span></div></div>
          )
        )}
        <p className="wf-muted" style={{ margin: 0 }}>Registration is renewed every year, including while you are teaching.</p>
      </div>
    </Card>
  )
}
