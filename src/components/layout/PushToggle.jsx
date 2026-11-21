import { useEffect, useState } from 'react'
import { BellOff, BellRing } from 'lucide-react'
import { disablePush, enablePush, getPushState, sendTestPush } from '@/utils/push'

/** "Alerts on this device": turns browser push notifications on or off for the signed-in user. */
export function PushToggle() {
  const [state, setState] = useState('loading')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let alive = true
    getPushState().then((s) => alive && setState(s))
    return () => { alive = false }
  }, [])

  if (state === 'loading' || state === 'unsupported') return null

  const turnOn = async () => {
    setBusy(true)
    setMsg('')
    try {
      setState(await enablePush())
      await sendTestPush().catch(() => undefined)
    } catch (e) {
      setMsg(e.message || 'Could not turn notifications on.')
      setState(await getPushState())
    } finally {
      setBusy(false)
    }
  }
  const turnOff = async () => {
    setBusy(true)
    try { setState(await disablePush()) } finally { setBusy(false) }
  }

  return (
    <div className="wf-notif__push">
      {state === 'on' ? (
        <>
          <span><BellRing size={15} />Alerts are on for this browser</span>
          <button type="button" onClick={turnOff} disabled={busy}>Turn off</button>
        </>
      ) : state === 'blocked' ? (
        <span><BellOff size={15} />Notifications are blocked in your browser settings for this site.</span>
      ) : (
        <>
          <span><BellOff size={15} />Get alerts even when this tab is closed</span>
          <button type="button" onClick={turnOn} disabled={busy}>{busy ? 'Turning on…' : 'Turn on'}</button>
        </>
      )}
      {msg && <p>{msg}</p>}
    </div>
  )
}
