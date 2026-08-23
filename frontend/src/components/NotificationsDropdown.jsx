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
  UserCheck, 
  Clock 
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load and sync notifications
  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000); // 30s poll

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('plan_approved', fetchLiveNotifications);
    window.addEventListener('checkin_approved', fetchLiveNotifications);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('plan_approved', fetchLiveNotifications);
      window.removeEventListener('checkin_approved', fetchLiveNotifications);
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

      // Read persisted status from localStorage
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
            iconBg: '#FEF3C7',
            iconColor: '#D97706',
            title: `طلب موقع جديد (#${ord.order_number || 'KZ-1001'})`,
            body: `${ord.customer_name} اشترك في باقة ${ord.package_name || 'ماكس'} بمبلغ ${ord.amount} ج.م.`,
            time: 'طلب موقع',
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
            iconBg: '#E0F2FE',
            iconColor: '#0284C7',
            title: `استمارة صحية واردة (#${sub.user?.client_code || sub.id})`,
            body: `${sub.user?.full_name || 'مشترك جديد'} أكمل استمارة التقييم ومصفوفة الإصابات.`,
            time: 'استمارة',
            link: `/intake/submissions?review=${sub.id}`,
            isRead: Boolean(readMap[`intake-${sub.id}`]),
            isCompleted: Boolean(isApproved),
            actionLabel: isApproved ? 'تم اعتماد الخطة وإرسالها' : 'مراجعة وتوليد الخطة',
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
            iconBg: '#ECFDF5',
            iconColor: '#059669',
            title: `تقرير متابعة أسبوعي (أسبوع ${chk.week_number})`,
            body: `${chk.user?.full_name || 'المتدرب'} سجل الوزن الجديد والالتزام (${chk.nutrition_adherence_percent || 100}%).`,
            time: 'متابعة حية',
            link: `/?review_checkin=${chk.id}`,
            isRead: Boolean(readMap[`chk-${chk.id}`]),
            isCompleted: Boolean(isReviewed),
            actionLabel: isReviewed ? 'تم اعتماد التعديل وإرساله' : 'مراجعة التقرير والتكيف',
            createdAt: chk.createdAt || new Date()
          });
        });
      }

      // 4. Expiring / Renewals Subscriptions
      if (subsData.clients) {
        subsData.clients.filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED').forEach((sub) => {
          const isExp = sub.status === 'EXPIRED';
          const isDone = completedMap[`sub-${sub.id}`];
          list.push({
            id: `sub-${sub.id}`,
            type: 'SUBSCRIPTION',
            icon: CreditCard,
            iconBg: '#FEE2E2',
            iconColor: '#DC2626',
            title: isExp ? `اشتراك منتهي: ${sub.full_name || sub.client_code}` : `تجديد وشيك: ${sub.full_name || sub.client_code}`,
            body: isExp ? `انتهى اشتراكه منذ ${Math.abs(sub.days_remaining)} يوم.` : `متبقي ${sub.days_remaining} أيام على انتهاء باقة ${sub.package}.`,
            time: 'مالي',
            link: '/subscriptions',
            isRead: Boolean(readMap[`sub-${sub.id}`]),
            isCompleted: Boolean(isDone),
            actionLabel: isDone ? 'تم التواصل والتجديد' : 'إرسال تذكير التجديد',
            createdAt: sub.createdAt || new Date()
          });
        });
      }

      // Sort by newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(list);
    } catch (e) {
      console.error('fetchLiveNotifications error:', e);
    }
  };

  const handleNotificationClick = (item) => {
    // 1. Mark as read in state & localStorage (removes blue unread dot)
    const readMap = JSON.parse(localStorage.getItem('z_notif_read_map') || '{}');
    readMap[item.id] = true;
    localStorage.setItem('z_notif_read_map', JSON.stringify(readMap));

    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));

    // 2. Navigate to destination
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
    <div className="position-relative" ref={dropdownRef} dir="rtl">
      
      {/* Bell Button (Facebook Style with Badge) */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="btn d-flex align-items-center justify-content-center position-relative"
        style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          background: isOpen ? '#E0F2FE' : '#F8FAFC',
          color: isOpen ? '#0284C7' : '#475569',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          padding: 0,
          cursor: 'pointer'
        }}
        title="الإشعارات والتنبيهات"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="19" 
          height="19" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ color: isOpen ? '#0284C7' : '#475569', display: 'block' }}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span 
            className="position-absolute d-flex align-items-center justify-content-center text-white font-monospace fw-bold"
            style={{ 
              top: '-4px', 
              left: '-4px', 
              background: '#EF4444', 
              fontSize: '10px', 
              minWidth: '18px', 
              height: '18px', 
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
              padding: '0 4px'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Facebook-Style Floating Notifications Dropdown */}
      {isOpen && (
        <div 
          className="dropdown-menu show shadow-2xl p-0 mt-2" 
          style={{ 
            width: '380px', 
            maxWidth: '92vw',
            borderRadius: '20px', 
            border: '1px solid #E2E8F0',
            zIndex: 1080, 
            position: 'absolute',
            left: 0,
            background: '#FFFFFF',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16)',
            overflow: 'hidden'
          }}
          dir="rtl"
        >
          {/* 1. Header (Facebook Style) */}
          <div className="p-3 pb-2 border-bottom bg-white" style={{ borderColor: '#F1F5F9' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <h6 className="fw-black text-dark mb-0" style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                  الإشعارات
                </h6>
                {unreadCount > 0 && (
                  <span 
                    className="badge rounded-pill fw-bold"
                    style={{ fontSize: '11px', background: '#E0F2FE', color: '#0284C7', padding: '3px 8px' }}
                  >
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button 
                  type="button" 
                  onClick={markAllAsRead}
                  className="btn btn-sm d-flex align-items-center gap-1 text-primary p-0 border-0 bg-transparent fw-bold"
                  style={{ fontSize: '0.78rem', color: '#0284C7' }}
                >
                  <CheckCheck style={{ width: '15px', height: '15px' }} />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Sub Tabs: الكل / غير المقروءة */}
            <div className="d-flex gap-2 pt-1">
              <button 
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${activeFilter === 'ALL' ? 'btn-primary text-white' : 'btn-light border text-muted'}`}
                style={{ fontSize: '0.78rem', height: '28px' }}
              >
                الكل ({notifications.length})
              </button>
              <button 
                type="button"
                onClick={() => setActiveFilter('UNREAD')}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${activeFilter === 'UNREAD' ? 'btn-primary text-white' : 'btn-light border text-muted'}`}
                style={{ fontSize: '0.78rem', height: '28px' }}
              >
                غير المقروءة ({unreadCount})
              </button>
            </div>
          </div>

          {/* 2. Notification Items List */}
          <div style={{ maxHeight: '390px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                  style={{ width: '48px', height: '48px', background: '#F1F5F9', color: '#94A3B8' }}
                >
                  <Bell style={{ width: '22px', height: '22px' }} />
                </div>
                <p className="fw-bold text-dark mb-1" style={{ fontSize: '0.88rem' }}>لا توجد إشعارات جديدة</p>
                <small className="text-muted" style={{ fontSize: '0.76rem' }}>تمت متابعة واعتماد جميع الحالات والتقارير بنجاح.</small>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const IconComponent = item.icon || Bell;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className="p-3 d-flex align-items-start gap-3 transition border-bottom"
                    style={{
                      cursor: 'pointer',
                      background: !item.isRead ? '#F0F9FF' : '#FFFFFF',
                      borderColor: '#F1F5F9',
                      position: 'relative'
                    }}
                  >
                    {/* Category Icon */}
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs mt-0.5"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: item.iconBg, 
                        color: item.iconColor 
                      }}
                    >
                      <IconComponent style={{ width: '19px', height: '19px' }} />
                    </div>

                    {/* Notification Text & Metadata */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <strong 
                          className={`d-block text-truncate ${!item.isRead ? 'fw-black text-dark' : 'fw-bold text-slate-700'}`}
                          style={{ fontSize: '0.84rem' }}
                        >
                          {item.title}
                        </strong>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          {item.time}
                        </span>
                      </div>

                      <p className="text-muted mb-2 line-clamp-2" style={{ fontSize: '0.78rem', lineHeight: '1.45', color: '#475569' }}>
                        {item.body}
                      </p>

                      {/* Action Execution Status Pill */}
                      <div className="d-flex align-items-center gap-2">
                        {item.isCompleted ? (
                          <span 
                            className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1"
                            style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.7rem', padding: '3px 8px' }}
                          >
                            <Check style={{ width: '12px', height: '12px' }} />
                            <span>{item.actionLabel}</span>
                          </span>
                        ) : (
                          <span 
                            className="badge rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                            style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontSize: '0.7rem', padding: '3px 8px' }}
                          >
                            <Clock style={{ width: '12px', height: '12px' }} />
                            <span>{item.actionLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Facebook-Style Blue Unread Dot */}
                    {!item.isRead && (
                      <div 
                        className="rounded-circle flex-shrink-0 align-self-center"
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          background: '#0284C7',
                          boxShadow: '0 0 0 2px #BAE6FD'
                        }}
                        title="غير مقروء"
                      ></div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 3. Footer */}
          <div className="p-2 text-center bg-slate-50 border-top" style={{ borderColor: '#F1F5F9' }}>
            <button 
              type="button"
              onClick={() => { setIsOpen(false); navigate('/intake/submissions'); }}
              className="btn btn-link text-primary fw-bold text-decoration-none p-1"
              style={{ fontSize: '0.78rem', color: '#0284C7' }}
            >
              عرض جميع استمارات ومتابعات المشتركين
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
