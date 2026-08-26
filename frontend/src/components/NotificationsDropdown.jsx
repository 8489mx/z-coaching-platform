import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Check, 
  ClipboardList, 
  ActivitySquare, 
  CreditCard, 
  ShoppingBag, 
  Clock 
} from 'lucide-react';
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
      const [checkinsRes, subsRes, intakesRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`).catch(() => ({ json: () => ({ checkins: [] }) })),
        fetch(`${API_BASE}/api/v1/subscriptions/overview`).catch(() => ({ json: () => ({ clients: [] }) })),
        fetch(`${API_BASE}/api/v1/intake/submissions`).catch(() => ({ json: () => ({ submissions: [] }) })),
        fetch(`${API_BASE}/api/v1/orders`).catch(() => ({ json: () => ({ orders: [] }) }))
      ]);

      const checkinsData = await checkinsRes.json();
      const subsData = await subsRes.json();
      const intakesData = await intakesRes.json();
      const ordersData = await ordersRes.json();

      const readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}');
      const completedMap = JSON.parse(localStorage.getItem('z_notif_completed_map') || '{}');

      const list = [];

      // 1. Website Orders Alerts
      if (ordersData.orders && ordersData.orders.length > 0) {
        ordersData.orders.forEach((ord) => {
          const isActivated = ord.status === 'ACTIVATED' || completedMap[`ord-${ord.id}`];
          list.push({
            id: `ord-${ord.id}`,
            type: 'ORDER',
            icon: ShoppingBag,
            title: `طلب موقع جديد (#${ord.order_number || '1001'})`,
            body: `${ord.customer_name} اشترك في باقة ${ord.package_name || 'ماكس'} بمبلغ ${ord.amount} ج.م.`,
            time: 'طلب جديد',
            link: '/customers?tab=orders',
            isRead: Boolean(readMap[`ord-${ord.id}`]),
            isCompleted: Boolean(isActivated),
            actionLabel: isActivated ? 'تم تفعيل الحساب' : 'تفعيل المشترك',
            createdAt: ord.createdAt || new Date()
          });
        });
      }

      // 2. New Intake Submissions
      if (intakesData.submissions && intakesData.submissions.length > 0) {
        intakesData.submissions.forEach((sub) => {
          const isApproved = sub.status === 'APPROVED' || sub.status === 'REVIEWED' || completedMap[`intake-${sub.id}`];
          list.push({
            id: `intake-${sub.id}`,
            type: 'INTAKE',
            icon: ClipboardList,
            title: `استمارة صحية واردة (#${sub.user?.client_code || sub.id})`,
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
    const readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}');
    readMap[item.id] = true;
    localStorage.setItem('z_notif_read_map', JSON.stringify(readMap));

    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const markAllAsRead = () => {
    const readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}');
    notifications.forEach(n => { readMap[n.id] = true; });
    localStorage.setItem('z_notif_read_map', JSON.stringify(readMap));
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
          transition: 'all 0.15s ease'
        }}
        title="الإشعارات والتنبيهات"
      >
        <Bell size={14} color="#475569" />
        
        {unreadCount > 0 && (
          <span 
            style={{ 
              position: 'absolute',
              top: '-4px', 
              left: '-4px', 
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
            width: '360px', 
            maxWidth: '90vw',
            borderRadius: '12px', 
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
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>
                  الإشعارات
                </strong>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '10.5px', background: '#F1F5F9', color: '#0F172A', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button 
                  type="button" 
                  onClick={markAllAsRead}
                  style={{ fontSize: '11.5px', color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, padding: 0 }}
                >
                  <CheckCheck size={13} />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                type="button"
                onClick={() => setActiveFilter('ALL')}
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 10px', 
                  borderRadius: '4px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: activeFilter === 'ALL' ? 800 : 600,
                  background: activeFilter === 'ALL' ? '#0F172A' : '#F1F5F9',
                  color: activeFilter === 'ALL' ? '#FFFFFF' : '#64748B'
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
                  borderRadius: '4px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: activeFilter === 'UNREAD' ? 800 : 600,
                  background: activeFilter === 'UNREAD' ? '#0F172A' : '#F1F5F9',
                  color: activeFilter === 'UNREAD' ? '#FFFFFF' : '#64748B'
                }}
              >
                غير المقروءة ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}
                >
                  <Bell size={18} />
                </div>
                <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد إشعارات جديدة</strong>
                <small style={{ fontSize: '11px', color: '#64748B' }}>تمت متابعة واعتماد جميع الحالات بنجاح.</small>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const IconComponent = item.icon || Bell;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      cursor: 'pointer',
                      background: !item.isRead ? '#F8FAFC' : '#FFFFFF',
                      borderBottom: '1px solid #F1F5F9',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = !item.isRead ? '#F8FAFC' : '#FFFFFF')}
                  >
                    <div 
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px',
                        background: '#F1F5F9', 
                        border: '1px solid #E2E8F0',
                        color: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <IconComponent size={14} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: !item.isRead ? 800 : 600 }}>
                          {item.title}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>{item.time}</span>
                      </div>

                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {item.body}
                      </p>

                      <div>
                        {item.isCompleted ? (
                          <span style={{ background: '#F1F5F9', color: '#059669', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={10} />
                            <span>{item.actionLabel}</span>
                          </span>
                        ) : (
                          <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={10} />
                            <span>{item.actionLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <button 
              type="button"
              onClick={() => { setIsOpen(false); navigate('/intake/submissions'); }}
              style={{ fontSize: '11.5px', color: '#0F172A', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              عرض جميع استمارات المشتركين
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
