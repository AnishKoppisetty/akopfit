/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }

// Precache the built app shell (keeps offline + install behavior).
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Incoming push -> show a system notification.
self.addEventListener('push', (event) => {
  let payload: { title?: string; body?: string; url?: string; tag?: string } = {}
  try { payload = event.data?.json() ?? {} } catch { payload = { body: event.data?.text() } }

  const title = payload.title || 'AkopFit'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: payload.tag,
      data: { url: payload.url || '/' },
    }),
  )
})

// Tapping a notification focuses (or opens) the app at the target URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        const wc = w as WindowClient
        if ('focus' in wc) { wc.navigate(url); return wc.focus() }
      }
      return self.clients.openWindow(url)
    }),
  )
})
