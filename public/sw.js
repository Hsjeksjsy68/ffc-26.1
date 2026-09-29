// Service Worker for Flamehunter FC Phone Push Notifications
// Provides background notification dispatch, mobile notification shade handling,
// lock-screen notifications, device vibration, and notification click navigation.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle user clicking on a phone notification from system notification drawer / lock screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new window to the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle Web Push events received by the device
self.addEventListener('push', (event) => {
  let data = {
    title: '🔥 Flamehunter FC Alert',
    body: 'New tactical squad update or match reminder.',
    tag: 'flamehunter-general',
    url: '/'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const title = data.title || '🔥 Flamehunter FC Alert';
  const options = {
    body: data.body || 'New squad announcement',
    icon: '/icon-192.png',
    badge: '/flamehunter_fc_logo.jpg',
    vibrate: [250, 120, 250, 120, 400],
    tag: data.tag || `fh-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle background messages passed to service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_PHONE_NOTIFICATION') {
    const { title, body, tag, url, delayMs } = event.data;
    const deliverNotification = () => {
      self.registration.showNotification(title || '🔥 Flamehunter FC Alert', {
        body: body || 'Squad alert',
        icon: '/icon-192.png',
        badge: '/flamehunter_fc_logo.jpg',
        vibrate: [250, 120, 250, 120, 400],
        tag: tag || `fh-${Date.now()}`,
        renotify: true,
        requireInteraction: false,
        data: { url: url || '/' }
      });
    };

    if (delayMs && delayMs > 0) {
      setTimeout(deliverNotification, delayMs);
    } else {
      deliverNotification();
    }
  }
});
