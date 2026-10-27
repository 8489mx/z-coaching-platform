import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  ClipboardList, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  CalendarX,
  RefreshCw,
  Clock,
  MessageSquare,
  Dumbbell,
  UtensilsCrossed,
  HeartPulse,
  MoreVertical, 
  CheckCircle2 
} from 'lucide-react';
import { API_BASE } from '../config/api';

/**
 * إرجاع الأيقونة والتدرج اللوني الدلالي لكل نوع إشعار لتمييزه فورياً
 */
function getNotificationVisuals(item) {
  const type = String(item.type || '').toUpperCase();
  const title = String(item.title || '');
  const body = String(item.body || '');
  const text = `${title} ${body}`;

  // 1. اشتراك منتهي (تحذير صريح - أحمر طوارئ)
  if (type === 'EXPIRED_SUBSCRIPTION' || text.includes('اشتراك منتهي') || text.includes('انتهت صلاحية')) {
    return {
      icon: CalendarX,
      bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      shadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
      badge: 'منتهي'
    };
  }

  // 2. تجديد وشيك للباقة (تنبيه تجديد - برتقالي / عنبري دافئ)
  if (type === 'EXPIRING_SOON' || text.includes('تجديد وشيك') || text.includes('متبقي') || text.includes('قرب انتهاء')) {
    return {
      icon: RefreshCw,
      bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      shadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
      badge: 'تجديد'
    };
  }

  // 3. استمارة صحية جديدة / مشترك جديد (بيانات طبية - أزرق رسمي ملكي)
  if (type === 'INTAKE' || text.includes('استمارة') || text.includes('بيانات صحية') || text.includes('مشترك جديد')) {
    return {
      icon: ClipboardList,
      bg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      shadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
      badge: 'استمارة'
    };
  }

  // 4. تقرير متابعة أسبوعي / وزن والتزام (لياقة وتطور - أخضر زمردي صحي)
  if (type === 'CHECKIN' || text.includes('متابعة أسبوعي') || text.includes('الوزن الجديد') || text.includes('التزام')) {
    return {
      icon: TrendingUp,
      bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      shadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
      badge: 'متابعة'
    };
  }

  // 5. رسائل ومحادثات واتساب وتذكيرات (واتساب - أخضر حيوي)
  if (type === 'REMINDER' || type === 'WHATSAPP' || text.includes('واتساب') || text.includes('تذكير') || text.includes('رسالة')) {
    return {
      icon: MessageSquare,
      bg: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      shadow: '0 2px 6px rgba(34, 197, 94, 0.25)',
      badge: 'واتساب'
    };
  }

  // 6. مدفوعات وسداد مالي واشتراكات نشطة (مالية - بنفسجي ملكي)
  if (type === 'PAYMENT' || type === 'FINANCIAL' || text.includes('دفع') || text.includes('سداد') || text.includes('فاتورة') || text.includes('تحويل')) {
    return {
      icon: Wallet,
      bg: 'linear-gradient(135deg, #7C3AED 0%, #673DE6 100%)',
      shadow: '0 2px 6px rgba(103, 61, 230, 0.25)',
      badge: 'مالية'
    };
  }

  // 7. تمارين وبرامج تدريبية (حديد - نيلي)
  if (type === 'TRAINING' || text.includes('تمرين') || text.includes('تدريب') || text.includes('حديد') || text.includes('برنامج')) {
    return {
      icon: Dumbbell,
      bg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      shadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
      badge: 'تمرين'
    };
  }

  // 8. تغذية وماكروز ووجبات (تغذية - برتقالي دافئ)
  if (type === 'NUTRITION' || text.includes('تغذية') || text.includes('سعرات') || text.includes('ماكروز') || text.includes('وجبة')) {
    return {
      icon: UtensilsCrossed,
      bg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      shadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
      badge: 'تغذية'
    };
  }

  // 9. تحاليل وفحوصات مخبرية (صحة - قرمزي)
  if (type === 'LAB' || text.includes('تحليل') || text.includes('فحص') || text.includes('مختبر') || text.includes('دم')) {
    return {
      icon: HeartPulse,
      bg: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
      shadow: '0 2px 6px rgba(225, 29, 72, 0.25)',
      badge: 'تحاليل'
    };
  }

  // افتراضي
  return {
    icon: item.icon || Bell,
    bg: 'linear-gradient(135deg, #7C3AED 0%, #673DE6 100%)',
    shadow: '0 2px 6px rgba(103, 61, 230, 0.25)',
    badge: 'تنبيه'
  };
}

function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 2) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} د`;
  if (diffHours < 24) return `منذ ${diffHours} س`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
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
        } catch {}
        return {};
      };

      const checkinsData = await safeJson(checkinsRes);
      const subsData = await safeJson(subsRes);
      const intakesData = await safeJson(intakesRes);

      let readMap = {};
      let completedMap = {};
      try {
        readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}') || {};
      } catch {}
      try {
        completedMap = JSON.parse(localStorage.getItem('z_notif_completed_map') || '{}') || {};
      } catch {}

      const list = [];

      // 1. New Intake Submissions
      if (intakesData.submissions && intakesData.submissions.length > 0) {
        intakesData.submissions.forEach((sub) => {
          const isApproved = sub.status === 'APPROVED' || sub.status === 'REVIEWED' || completedMap[`intake-${sub.id}`];
          const rawCode = sub.user?.client_code || sub.answers?.client_code || sub.client_code || '1';
          const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
          list.push({
            id: `intake-${sub.id}`,
            type: 'INTAKE',
            icon: ClipboardList,
            title: 'استمارة صحية واردة',
            code: cleanCode,
            body: `${sub.user?.full_name || 'مشترك جديد'} أكمل استمارة التقييم والبيانات الصحية بنجاح.`,
            link: `/intake/submissions?review=${sub.id}`,
            isRead: Boolean(readMap[`intake-${sub.id}`]),
            isCompleted: Boolean(isApproved),
            actionLabel: isApproved ? 'عرض البرنامج' : 'مراجعة الاستمارة',
            createdAt: sub.createdAt || new Date()
          });
        });
      }

      // 2. Weekly Check-ins
      if (checkinsData.checkins && checkinsData.checkins.length > 0) {
        checkinsData.checkins.forEach((chk) => {
          const isReviewed = chk.status === 'REVIEWED' || chk.status === 'RESOLVED' || completedMap[`chk-${chk.id}`];
          list.push({
            id: `chk-${chk.id}`,
            type: 'CHECKIN',
            icon: TrendingUp,
            title: `تقرير متابعة أسبوعي (أسبوع ${chk.week_number})`,
            body: `${chk.user?.full_name || 'المتدرب'} سجل الوزن الجديد والالتزام (${chk.nutrition_adherence_percent || 100}%).`,
            link: `/?review_checkin=${chk.id}`,
            isRead: Boolean(readMap[`chk-${chk.id}`]),
            isCompleted: Boolean(isReviewed),
            actionLabel: isReviewed ? 'عرض التقرير' : 'اعتماد التقييم',
            createdAt: chk.createdAt || new Date()
          });
        });
      }

      // 3. Expiring Subscriptions & Expired Subscriptions
      if (subsData.clients) {
        subsData.clients.filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED').forEach((sub) => {
          const isExp = sub.status === 'EXPIRED';
          const isDone = completedMap[`sub-${sub.id}`];
          list.push({
            id: `sub-${sub.id}`,
            type: isExp ? 'EXPIRED_SUBSCRIPTION' : 'EXPIRING_SOON',
            icon: isExp ? CalendarX : RefreshCw,
            title: isExp ? `اشتراك منتهي: ${sub.full_name || sub.client_code}` : `تجديد وشيك: ${sub.full_name || sub.client_code}`,
            body: isExp ? `انتهت صلاحية باقة المشترك منذ ${Math.abs(sub.days_remaining)} يوم.` : `متبقي ${sub.days_remaining} أيام على انتهاء الباقة التدريبية.`,
            link: '/coach/financials',
            isRead: Boolean(readMap[`sub-${sub.id}`]),
            isCompleted: Boolean(isDone),
            actionLabel: isDone ? 'مكتمل' : (isExp ? 'تجديد الاشتراك' : 'متابعة التجديد'),
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
    try { readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}') || {}; } catch {}
    readMap[item.id] = true;
    try { localStorage.setItem('z_notif_read_map', JSON.stringify(readMap)); } catch {}

    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const markAllAsRead = () => {
    let readMap = {};
    try { readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}') || {}; } catch {}
    notifications.forEach(n => { readMap[n.id] = true; });
    try { localStorage.setItem('z_notif_read_map', JSON.stringify(readMap)); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative', overflow: 'visible' }} ref={dropdownRef} dir="rtl">
      
      {/* Hostinger Trigger Bell Button */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '34px', 
          height: '34px', 
          borderRadius: '9999px', 
          border: '1px solid #D0D5DD',
          background: isOpen ? '#F1F5F9' : '#FFFFFF',
          color: isOpen ? '#111827' : '#475569',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
        }}
        title="الإشعارات والمهام"
        aria-expanded={isOpen}
      >
        <Bell size={15} color="#475569" strokeWidth={2.0} />
      </button>

      {/* Red Unread Count Badge */}
      {unreadCount > 0 && (
        <span 
          style={{ 
            position: 'absolute',
            top: '-5px', 
            right: '-4px', 
            background: '#EF4444', 
            color: '#FFFFFF',
            fontSize: '9.5px', 
            fontWeight: 800,
            minWidth: '16px', 
            height: '16px', 
            borderRadius: '8px',
            border: '2px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 10,
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
            fontFamily: 'JetBrains Mono, system-ui, sans-serif'
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Hostinger "Your to-dos" Popover Dropdown */}
      {isOpen && (
        <div 
          style={{ 
            width: '420px', 
            maxWidth: '92vw',
            borderRadius: '20px',
            border: '1px solid #EAECF0',
            zIndex: 1100, 
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 10px)',
            background: '#F8F9FA',
            boxShadow: '0 20px 48px -8px rgba(16, 24, 40, 0.16), 0 4px 14px rgba(16, 24, 40, 0.05)',
            padding: '18px 20px 20px 20px',
            boxSizing: 'border-box',
            direction: 'rtl'
          }}
        >
          {/* Popover Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', color: '#111827', fontWeight: 800, letterSpacing: '-0.2px' }}>
                المهام والتنبيهات
              </span>
              {unreadCount > 0 && (
                <span style={{ 
                  fontSize: '11px', 
                  background: '#673DE6', 
                  color: '#FFFFFF', 
                  padding: '1px 8px', 
                  borderRadius: '6px', 
                  fontWeight: 700 
                }}>
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button 
                type="button" 
                onClick={markAllAsRead}
                style={{ 
                  fontSize: '12.5px', 
                  color: '#673DE6', 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  padding: 0,
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#5025D1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#673DE6'; }}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* White Card Island Container */}
          <div 
            style={{ 
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAECF0',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              overflow: 'hidden',
              maxHeight: '440px',
              overflowY: 'auto'
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '38px 20px' }}>
                <div 
                  style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '14px', 
                    background: '#F4F0FD', 
                    color: '#673DE6', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 12px auto' 
                  }}
                >
                  <CheckCircle2 size={22} strokeWidth={2.0} />
                </div>
                <div style={{ fontSize: '14px', color: '#111827', fontWeight: 700, marginBottom: '4px' }}>
                  جميع المهام مكتملة
                </div>
                <p style={{ fontSize: '12.5px', color: '#667085', margin: 0, lineHeight: 1.5 }}>
                  لا توجد تنبيهات معلقة تتطلب اتخاذ إجراء حالياً.
                </p>
              </div>
            ) : (
              notifications.map((item, idx) => {
                const visuals = getNotificationVisuals(item);
                const IconComponent = visuals.icon;
                const isLast = idx === notifications.length - 1;
                const isHovered = hoveredId === item.id;
                const isUnread = !item.isRead;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      borderBottom: isLast ? 'none' : '1px solid #EAECF0',
                      background: isUnread 
                        ? (isHovered ? '#F4EFFE' : '#FAF8FF') 
                        : (isHovered ? '#F8FAFC' : '#FFFFFF'),
                      borderRight: isUnread ? '3.5px solid #673DE6' : '3.5px solid transparent',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleNotificationClick(item)}
                    title={`${item.title}${item.code ? ` (#${item.code})` : ''}\n\n${item.body}`}
                  >
                    {/* Hostinger Semantic Squircle Icon */}
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px',
                        background: visuals.bg, 
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: visuals.shadow
                      }}
                    >
                      <IconComponent size={20} strokeWidth={2.0} color="#FFFFFF" />
                    </div>

                    {/* Content Column */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <div 
                          style={{ 
                            fontSize: '13.5px', 
                            fontWeight: isUnread ? 800 : 700, 
                            color: isUnread ? '#0F172A' : '#1E293B', 
                            lineHeight: 1.45,
                            wordBreak: 'break-word'
                          }}
                        >
                          {item.title}
                          {item.code ? (
                            <span 
                              dir="ltr" 
                              style={{ 
                                display: 'inline-block',
                                marginInlineStart: '6px',
                                fontFamily: 'JetBrains Mono, system-ui, sans-serif',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: isUnread ? '#673DE6' : '#64748B'
                              }}
                            >
                              ({`#${item.code}`})
                            </span>
                          ) : null}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {/* Unread "علامة خفيفة" Badge */}
                          {isUnread && (
                            <span 
                              style={{ 
                                fontSize: '10.5px', 
                                fontWeight: 700, 
                                color: '#673DE6', 
                                background: '#EDE8FD', 
                                padding: '1.5px 7px', 
                                borderRadius: '6px',
                                border: '1px solid rgba(103, 61, 230, 0.18)',
                                whiteSpace: 'nowrap',
                                lineHeight: '16px'
                              }}
                            >
                              جديد
                            </span>
                          )}

                          {/* Timestamp */}
                          {item.createdAt && (
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <p 
                        style={{ 
                          fontSize: '12.5px', 
                          color: isUnread ? '#334155' : '#64748B', 
                          margin: '0 0 12px 0', 
                          lineHeight: 1.55,
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.body}
                      </p>

                      {/* Action Pill Button */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(item);
                          }}
                          style={{
                            height: '32px',
                            padding: '0 18px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: isUnread ? '1px solid #C4B5FD' : '1px solid #D0D5DD',
                            color: isUnread ? '#673DE6' : '#111827',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#673DE6';
                            e.currentTarget.style.borderColor = '#673DE6';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = isUnread ? '#C4B5FD' : '#D0D5DD';
                            e.currentTarget.style.color = isUnread ? '#673DE6' : '#111827';
                          }}
                        >
                          <span>{item.actionLabel}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
