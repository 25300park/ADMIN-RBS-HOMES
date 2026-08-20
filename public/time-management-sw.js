self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json?.() || {} } catch { data = {} }
  const body = typeof data.body === 'string' ? data.body : '오늘의 시간관리 회고를 작성해 주세요.'
  const url = typeof data.url === 'string' && data.url.startsWith('/time-management') ? data.url : '/time-management/review'
  event.waitUntil(self.registration.showNotification('RBS HOMES 시간관리', {
    body,
    data: { url },
    icon: '/favicon.ico',
    tag: 'time-reflection-reminder',
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const rawUrl = event.notification.data?.url
  const url = typeof rawUrl === 'string' && rawUrl.startsWith('/time-management') ? rawUrl : '/time-management/review'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => new URL(client.url).pathname.startsWith('/time-management'))
    return existing ? existing.focus().then(() => existing.navigate?.(url)) : self.clients.openWindow(url)
  }))
})
