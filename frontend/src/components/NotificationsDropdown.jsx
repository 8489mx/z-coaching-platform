import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchAlerts();

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const [checkinsRes, subsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`),
        fetch(`${API_BASE}/api/v1/subscriptions/overview`)
      ]);

      const checkinsData = await checkinsRes.json();
      const subsData = await subsRes.json();

      const alertsList = [];

      // 1. Pending Check-ins alerts
      if (checkinsData.checkins && checkinsData.checkins.length > 0) {
        checkinsData.checkins.forEach((chk) => {
          alertsList.push({
            id: `chk-${chk.id}`,
            type: 'CHECKIN',
            title: `متابعة جديدة (أسبوع ${chk.week_number})`,
            desc: `${chk.user?.full_name || 'المتدرب'} أرسل تقرير الأوزان والمقاسات.`,
            link: `/?review_checkin=${chk.id}`,
            time: 'الآن',
            isRead: false,
          });
        });
      }

      // 2. Expiring soon subscriptions alerts
      if (subsData.clients) {
        subsData.clients.filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED').forEach((sub) => {
          const isExp = sub.status === 'EXPIRED';
          alertsList.push({
            id: `sub-${sub.id}`,
            type: 'SUBSCRIPTION',
            title: isExp ? `اشتراك منتهي: ${sub.full_name || sub.client_code}` : `تجديد قريب: ${sub.full_name || sub.client_code}`,
            desc: isExp ? `انتهى منذ ${Math.abs(sub.days_remaining)} يوم.` : `متبقي ${sub.days_remaining} أيام على باقة ${sub.package}.`,
            link: '/subscriptions',
            time: 'مالي',
            isRead: false,
          });
        });
      }

      setNotifications(alertsList);
      setUnreadCount(alertsList.length);
    } catch (e) {
      console.error('fetchAlerts error:', e);
    }
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="position-relative" ref={dropdownRef} dir="rtl">
      {/* Bell Button (34px compact) */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-light rounded-circle p-0 position-relative d-flex align-items-center justify-content-center transition-all shadow-xs"
        style={{ 
          width: '34px', 
          height: '34px', 
          border: '1px solid #e2e8f0',
          background: isOpen ? '#f5f3ff' : '#ffffff'
        }}
        title="التنبيهات والإشعارات"
      >
        <i className="ti ti-bell fs-6" style={{ color: isOpen ? '#261c6a' : '#475569' }}></i>
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-white text-white fw-bold shadow-xs"
            style={{ 
              fontSize: '0.62rem', 
              padding: '0.2em 0.48em',
              background: '#261c6a',
              minWidth: '17px'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Quiet Luxury Compact Dropdown */}
      {isOpen && (
        <div 
          className="dropdown-menu dropdown-menu-end show shadow-lg p-0 mt-2" 
          style={{ 
            width: '295px', 
            borderRadius: '14px', 
            border: '1px solid #e2e8f0',
            zIndex: 1070, 
            position: 'absolute',
            left: 0,
            overflow: 'hidden',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)'
          }}
        >
          {/* Header */}
          <div 
            className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center"
            style={{ borderColor: '#f1f5f9' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>الإشعارات</span>
              {unreadCount > 0 && (
                <span className="badge rounded-pill fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.66rem', border: '1px solid #ddd6fe' }}>
                  {unreadCount} جديد
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="btn btn-link p-0 text-decoration-none"
                style={{ fontSize: '0.72rem', color: '#261c6a', fontWeight: '600' }}
              >
                تحديد كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div className="custom-scroll" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted" style={{ fontSize: '0.8rem' }}>
                <i className="ti ti-bell-off fs-4 mb-1 d-block opacity-40"></i>
                لا توجد إشعارات جديدة
              </div>
            ) : (
              notifications.map((n) => (
                <Link 
                  key={n.id}
                  to={n.link}
                  onClick={() => setIsOpen(false)}
                  className="d-flex align-items-start gap-2 p-2 px-3 text-decoration-none transition-all border-bottom"
                  style={{ 
                    backgroundColor: n.isRead ? '#ffffff' : '#fbfaff',
                    borderColor: '#f8fafc',
                    borderRight: !n.isRead ? '3px solid #261c6a' : '3px solid transparent'
                  }}
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                    style={{ 
                      width: '26px', 
                      height: '26px', 
                      background: n.type === 'CHECKIN' ? '#f5f3ff' : '#fffbeb', 
                      color: n.type === 'CHECKIN' ? '#261c6a' : '#d97706',
                      border: n.type === 'CHECKIN' ? '1px solid #ede9fe' : '1px solid #fde68a'
                    }}
                  >
                    <i className={n.type === 'CHECKIN' ? 'ti ti-clipboard-check fs-6' : 'ti ti-credit-card fs-6'}></i>
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-center mb-0">
                      <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>{n.title}</span>
                      <small style={{ fontSize: '0.64rem', color: '#94a3b8' }}>{n.time}</small>
                    </div>
                    <p className="text-muted mb-0 text-truncate" style={{ fontSize: '0.72rem', lineHeight: '1.3' }}>
                      {n.desc}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 text-center bg-light border-top" style={{ borderColor: '#f1f5f9' }}>
            <Link 
              to="/subscriptions" 
              onClick={() => setIsOpen(false)} 
              className="text-decoration-none fw-semibold"
              style={{ fontSize: '0.74rem', color: '#261c6a' }}
            >
              عرض سجل الاشتراكات والمتابعات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
