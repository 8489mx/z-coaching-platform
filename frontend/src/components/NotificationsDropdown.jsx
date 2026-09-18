import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Check, ClipboardList, ActivitySquare, CreditCard, Clock } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchLiveNotifications = async () => {
    try {
      const [checkinsRes, subsRes, intakesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`).catch(() => ({ json: () => ({ checkins: [] }) })),
        fetch(`${API_BASE}/api/v1/subscriptions/overview`).catch(() => ({ json: () => ({ clients: [] }) })),
        fetch(`${API_BASE}/api/v1/intake/submissions`).catch(() => ({ json: () => ({ submissions: [] }) }))
      ]);

      const safeJson = async (res) => {
        try {
          if (res && typeof res.json === 'function') return await res.json();
        } catch (e) {}
        return {};
      };

      const checkinsData = await safeJson(checkinsRes);
      const subsData = await safeJson(subsRes);
      const intakesData = await safeJson(intakesRes);

      let readMap = {};
      let completedMap = {};
      try {
        readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}') || {};
      } catch (e) {}
      try {
        completedMap = JSON.parse(localStorage.getItem('z_notif_completed_map') || '{}') || {};
      } catch (e) {}

      const list = [];

      // 2. New Intake Submissions
      if (intakesData.submissions && intakesData.submissions.length > 0) {
        intakesData.submissions.forEach((sub) => {
          const isApproved = sub.status === 'APPROVED' || sub.status === 'REVIEWED' || completedMap[`intake-${sub.id}`];
          const rawCode = sub.user?.client_code || sub.answers?.client_code || sub.client_code || '1';
          const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
          list.push({
            id: `intake-${sub.id}`,
            type: 'INTAKE',
            icon: ClipboardList,
            title: `استمارة صحية واردة (#${cleanCode})`,
            body: `${sub.user?.full_name || 'مشترك جديد'} أكمل استمارة التقييم والمصفوفة الصحية.`,
            time: 'استمارة',
            link: `/intake/submissions?review=${sub.id}`,
            isRead: Boolean(readMap[`intake-${sub.id}`]),
            isCompleted: Boolean(isApproved),
            actionLabel: isApproved ? 'تم اعتماد الخطة' : 'مراجعة وتوليد الخطة',
            createdAt: sub.createdAt || new Date()
          });
        });
      }

      // 3. Weekly Check-ins
      if (checkinsData.checkins && checkinsData.checkins.length > 0) {
        checkinsData.checkins.forEach((chk) => {
          const isReviewed = chk.status === 'REVIEWED' || chk.status === 'RESOLVED' || completedMap[`chk-${chk.id}`];
          list.push({
            id: `chk-${chk.id}`,
            type: 'CHECKIN',
            icon: ActivitySquare,
            title: `تقرير متابعة أسبوعي (أسبوع ${chk.week_number})`,
            body: `${chk.user?.full_name || 'المتدرب'} سجل الوزن الجديد والالتزام (${chk.nutrition_adherence_percent || 100}%).`,
            time: 'متابعة حية',
            link: `/?review_checkin=${chk.id}`,
            isRead: Boolean(readMap[`chk-${chk.id}`]),
            isCompleted: Boolean(isReviewed),
            actionLabel: isReviewed ? 'تم اعتماد التعديل' : 'مراجعة التقرير',
            createdAt: chk.createdAt || new Date()
          });
        });
      }

      // 4. Expiring Subscriptions
      if (subsData.clients) {
        subsData.clients.filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED').forEach((sub) => {
          const isExp = sub.status === 'EXPIRED';
          const isDone = completedMap[`sub-${sub.id}`];
          list.push({
            id: `sub-${sub.id}`,
            type: 'SUBSCRIPTION',
            icon: CreditCard,
            title: isExp ? `اشتراك منتهي: ${sub.full_name || sub.client_code}` : `تجديد وشيك: ${sub.full_name || sub.client_code}`,
            body: isExp ? `انتهى اشتراكه منذ ${Math.abs(sub.days_remaining)} يوم.` : `متبقي ${sub.days_remaining} أيام على انتهاء الباقة.`,
            time: 'مالي',
            link: '/subscriptions',
            isRead: Boolean(readMap[`sub-${sub.id}`]),
            isCompleted: Boolean(isDone),
            actionLabel: isDone ? 'تم التجديد' : 'إرسال تذكير',
            createdAt: sub.createdAt || new Date()
          });
        });
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    } catch (e) {
      console.error('fetchLiveNotifications error:', e);
    }
  };

  const handleNotificationClick = (item) => {
    let readMap = {};
    try { readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}') || {}; } catch (e) {}
    readMap[item.id] = true;
    try { localStorage.setItem('z_notif_read_map', JSON.stringify(readMap)); } catch (e) {}

    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const markAllAsRead = () => {
    let readMap = {};
    try { readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}') || {}; } catch (e) {}
    notifications.forEach(n => { readMap[n.id] = true; });
    try { localStorage.setItem('z_notif_read_map', JSON.stringify(readMap)); } catch (e) {}
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = activeFilter === 'UNREAD' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef} dir="rtl">
      
      {/* 32px Standard Toolbar Bell Button */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
          background: isOpen ? '#F1F5F9' : '#F8FAFC',
          color: isOpen ? '#0F172A' : '#475569',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box'
        }}
        title="الإشعارات والتنبيهات"
      >
        <Bell size={14} color="#475569" />
        
        {unreadCount > 0 && (
          <span 
            style={{ 
              position: 'absolute',
              top: '-3px', 
              left: '-3px', 
              background: '#EF4444', 
              color: '#FFFFFF',
              fontSize: '9px', 
              fontWeight: 800,
              minWidth: '15px', 
              height: '15px', 
              borderRadius: '8px',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Notifications Dropdown */}
      {isOpen && (
        <div 
          style={{ 
            width: '350px', 
            maxWidth: '90vw',
            borderRadius: '10px', 
            border: '1px solid #E2E8F0',
            zIndex: 1100, 
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 8px)',
            background: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden'
          }}
          dir="rtl"
        >
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>
                  الإشعارات
                </strong>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '10.5px', background: '#2563EB', color: '#FFFFFF', padding: '1px 7px', borderRadius: '10px', fontWeight: 800 }}>
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button 
                  type="button" 
                  onClick={markAllAsRead}
                  style={{ fontSize: '11px', color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, padding: 0 }}
                >
                  <CheckCheck size={13} />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Sub Tabs (Facebook Style Pills) */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                type="button"
                onClick={() => setActiveFilter('ALL')}
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 10px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: activeFilter === 'ALL' ? 800 : 600,
                  background: activeFilter === 'ALL' ? '#0F172A' : '#F1F5F9',
                  color: activeFilter === 'ALL' ? '#FFFFFF' : '#475569'
                }}
              >
                الكل ({notifications.length})
              </button>
              <button 
                type="button"
                onClick={() => setActiveFilter('UNREAD')}
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 10px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: activeFilter === 'UNREAD' ? 800 : 600,
                  background: activeFilter === 'UNREAD' ? '#2563EB' : '#F1F5F9',
                  color: activeFilter === 'UNREAD' ? '#FFFFFF' : '#475569'
                }}
              >
                غير المقروءة ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List (Facebook Style Highlighting for Unread) */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div 
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}
                >
                  <Bell size={16} />
                </div>
                <strong style={{ fontSize: '12.5px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد إشعارات</strong>
                <small style={{ fontSize: '10.5px', color: '#64748B' }}>تمت مراجعة واعتماد جميع الإشعارات بنجاح.</small>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const IconComponent = item.icon || Bell;
                const isUnread = !item.isRead;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      cursor: 'pointer',
                      background: isUnread ? '#EFF6FF' : '#FFFFFF',
                      borderBottom: isUnread ? '1px solid #DBEAFE' : '1px solid #F1F5F9',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isUnread ? '#DBEAFE' : '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isUnread ? '#EFF6FF' : '#FFFFFF')}
                  >
                    {/* Notification Icon Badge */}
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '6px',
                        background: isUnread ? '#DBEAFE' : '#F1F5F9', 
                        border: isUnread ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                        color: isUnread ? '#1D4ED8' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComponent size={14} />
                    </div>

                    {/* Notification Text Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: isUnread ? 800 : 600 }}>
                          {item.title}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>{item.time}</span>
                      </div>

                      <p style={{ fontSize: '11px', color: isUnread ? '#334155' : '#64748B', margin: '0 0 4px 0', lineHeight: 1.35 }}>
                        {item.body}
                      </p>

                      <div>
                        {item.isCompleted ? (
                          <span style={{ background: '#F1F5F9', color: '#059669', fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={9} />
                            <span>{item.actionLabel}</span>
                          </span>
                        ) : (
                          <span style={{ background: isUnread ? '#DBEAFE' : '#F8FAFC', border: isUnread ? '1px solid #BFDBFE' : '1px solid #E2E8F0', color: isUnread ? '#1E40AF' : '#475569', fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={9} />
                            <span>{item.actionLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Facebook Blue Unread Dot */}
                    {isUnread && (
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#2563EB', 
                          flexShrink: 0,
                          boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)'
                        }} 
                        title="غير مقروء"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '6px', textAlign: 'center', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <button 
              type="button"
              onClick={() => { setIsOpen(false); navigate('/intake/submissions'); }}
              style={{ fontSize: '11px', color: '#0F172A', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              عرض جميع استمارات المشتركين
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
