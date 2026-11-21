import { apiRequest } from '@/services/apiClient'

/** Browser push notifications (self-hosted Web Push). The server decides what to send; this only subscribes the browser. */

const unwrap = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res)

export const isPushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function keyToBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function registration() {
  return navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)
}

/** 'unsupported' | 'blocked' (user denied in the browser) | 'off' | 'on' */
export async function getPushState() {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  if (Notification.permission !== 'granted') return 'off'
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    const sub = reg ? await reg.pushManager.getSubscription() : null
    return sub ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

export async function enablePush() {
  if (!isPushSupported()) throw new Error('This browser does not support notifications.')
  const config = unwrap(await apiRequest('/api/push/config'))
  if (!config?.enabled || !config.publicKey) throw new Error('Notifications are not set up on the server yet.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser settings for this site.')
  const reg = await registration()
  const existing = await reg.pushManager.getSubscription()
  const sub = existing || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(config.publicKey) }))
  await apiRequest('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) })
  return 'on'
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  const sub = reg ? await reg.pushManager.getSubscription() : null
  if (sub) {
    await apiRequest('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined)
    await sub.unsubscribe()
  }
  return 'off'
}

export async function sendTestPush() {
  return unwrap(await apiRequest('/api/push/test', { method: 'POST', body: JSON.stringify({}) }))
}
