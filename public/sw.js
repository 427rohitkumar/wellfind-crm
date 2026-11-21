/* Wellfind Academic: service worker for browser push notifications.
   It only shows notifications and opens the right page when one is clicked. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wellfind Academic', {
      body: data.body || '',
      icon: '/blue-logo-wellfind.png',
      badge: '/blue-logo-wellfind.png',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url.startsWith(self.location.origin) && 'focus' in w) {
          if ('navigate' in w) w.navigate(target)
          return w.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
