// Pillr service worker — handles Web Push notifications (iOS 16.4+ / Android / desktop)
/* eslint-disable no-undef */

self.addEventListener("install", () => {
  // Activate this worker immediately on first install
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of open pages without requiring a reload
  event.waitUntil(self.clients.claim());
});

// A push arrived — show the notification
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Pillr", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Pillr";
  const options = {
    body: data.body || "",
    icon: data.icon || "/apple-icon",
    badge: "/icon",
    tag: data.tag || "pillr-notification",
    data: { url: data.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification tapped — focus an existing window or open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
