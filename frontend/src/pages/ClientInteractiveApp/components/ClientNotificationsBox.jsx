import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../../../config/api';
import { subscribeWebPush } from '../../../utils/webPush';

// P2-C7: the client's own inbox inside the web app. This is a NEW component
// for clients only — the coach/admin NotificationsDropdown in the admin
// header is a different component and is left untouched. Fetches the inbox
// on mount, refreshes on open and every 60s, and marks items read on tap.
// Real push (browser notification while the app is closed) needs the owner
// to configure VAPID keys; without them the inbox still works and the
// enable button says so honestly instead of pretending.
export default function ClientNotificationsBox({ clientCode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pushNote, setPushNote] = useState('');

  const load = useCallback(async () => {
    if (!clientCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/client/${encodeURIComponent(clientCode)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.success !== true) {
        setError('تعذر تحميل الإشعارات. حاول مرة أخرى.');
        return;
      }
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : 0);
    } catch (e) {
      setError('تعذر تحميل الإشعارات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [clientCode]);

  useEffect(() => {
    load();
    if (!clientCode) return undefined;
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load, clientCode]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const markRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE}/api/v1/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: clientCode, notification_id: notificationId }),
      });
      setItems((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // Reading a notification is best-effort; the inbox still shows it.
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: clientCode }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      // Best-effort, same as markRead.
    }
  };

  const enablePush = async () => {
    setPushNote('جاري التفعيل...');
    const result = await subscribeWebPush(clientCode);
    if (result.ok) {
      setPushNote('تم تفعيل إشعارات المتصفح بنجاح.');
    } else if (result.reason === 'vapid_not_configured') {
      setPushNote('إشعارات المتصفح غير مفعلة من الكوتش بعد. صندوق الإشعارات هنا يعمل بشكل طبيعي.');
    } else if (result.reason === 'permission_denied') {
      setPushNote('تم رفض إذن الإشعارات من المتصفح. يمكنك تفعيله من إعدادات المتصفح.');
    } else if (result.reason === 'push_not_supported') {
      setPushNote('هذا المتصفح لا يدعم إشعارات المتصفح. صندوق الإشعارات هنا يعمل بشكل طبيعي.');
    } else {
      setPushNote(`تعذر تفعيل إشعارات المتصفح: ${result.reason}`);
    }
  };

  if (!clientCode) return null;

  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={toggle}
          style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
        >
          الإشعارات {unreadCount > 0 ? `(${unreadCount} جديدة)` : ''}
        </button>
        <button
          type="button"
          onClick={load}
          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
        >
          تحديث
        </button>
        <button
          type="button"
          onClick={enablePush}
          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
        >
          تفعيل إشعارات المتصفح
        </button>
      </div>
      {pushNote ? <p style={{ margin: '8px 0 0' }}>{pushNote}</p> : null}
      {open ? (
        <div style={{ marginTop: '10px', border: '1px solid #ddd', borderRadius: '12px', padding: '12px' }}>
          {loading ? <p>جاري التحميل...</p> : null}
          {error ? <p>{error}</p> : null}
          {!loading && !error && items.length === 0 ? <p>لا توجد إشعارات حتى الآن.</p> : null}
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markRead(n.id); }}
              style={{
                padding: '10px',
                marginBottom: '8px',
                borderRadius: '8px',
                background: n.is_read ? '#f7f7f7' : '#fff4e5',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: n.is_read ? 'normal' : 'bold' }}>{n.title}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.body}</div>
              {n.created_at ? <div style={{ fontSize: '12px', color: '#666' }}>{new Date(n.created_at).toLocaleString('ar-EG')}</div> : null}
            </div>
          ))}
          {items.length > 0 && unreadCount > 0 ? (
            <button type="button" onClick={markAllRead} style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
              تعيين الكل كمقروء
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
