// CareBridge Service Worker — Medication Reminders
// Runs in the background even when the browser tab is not active.

let schedule = []; // [{ id, name, dosage, time, active }]
let lastFired = '';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Receive medication schedule from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_SCHEDULE') {
    schedule = event.data.medications || [];
  }
});

// Check every 10 seconds for due medications
setInterval(() => {
  const now = new Date();
  const current =
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0');

  if (current === lastFired) return;

  const due = schedule.filter((m) => m.active && m.time === current);
  if (!due.length) return;

  lastFired = current;

  due.forEach((med) => {
    if (Notification.permission !== 'granted') return;
    self.registration.showNotification('💊 Medication Reminder — CareBridge', {
      body: `Time to take ${med.name}${med.dosage ? ` · ${med.dosage}` : ''}.`,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: `carebridge-med-${med.id}`,
      requireInteraction: true,
      data: { url: '/medications' },
    });
  });
}, 10000);

// Tap on notification → open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(target));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});
