import { API_BASE } from '../config/api';

// P2-C7: web push subscription helper. The browser asks the user for
// notification permission (a user gesture is required), subscribes through
// the service worker, and registers the subscription with the server, which
// stores it as this client's push device. Returns { ok, reason } — never a
// fake success: every failure names its cause.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeWebPush(clientCode) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'push_not_supported' };
  }
  const vapidKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VAPID_PUBLIC_KEY) || '';
  if (!vapidKey) {
    return { ok: false, reason: 'vapid_not_configured' };
  }
  if (Notification.permission === 'denied') {
    return { ok: false, reason: 'permission_denied' };
  }
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    }));
    const res = await fetch(`${API_BASE}/api/v1/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_code: clientCode, token: JSON.stringify(subscription), device_info: { platform: 'Web' } }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.success !== true) {
      return { ok: false, reason: 'server_rejected' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err && err.message ? err.message : 'subscribe_failed' };
  }
}
