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
            title: `متابعة أسبوعية جديدة (الأسبوع ${chk.week_number})`,
            desc: `المتدرب ${chk.user?.full_name || chk.user_id} أرسل تقرير أوزان الأسبوع ومحيط الخصر.`,
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
            title: isExp ? `اشتراك منتهي: ${sub.full_name || sub.client_code}` : `تجديد اشتراك قريب: ${sub.full_name || sub.client_code}`,
            desc: isExp ? `انتهى الاشتراك منذ ${Math.abs(sub.days_remaining)} يوم.` : `متبقي ${sub.days_remaining} أيام على انتهاء باقة (${sub.package}).`,
            link: '/subscriptions',
            time: 'تنبيه مالي',
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
      {/* Bell Button */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-light rounded-circle p-2 position-relative d-flex align-items-center justify-content-center shadow-sm"
        style={{ width: '40px', height: '40px', border: '1px solid #e2e8f0' }}
        title="التنبيهات والإشعارات"
      >
        <i className="ti ti-bell fs-5 text-dark"></i>
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
            style={{ fontSize: '0.68rem', padding: '0.28em 0.55em' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="dropdown-menu dropdown-menu-end show shadow-lg border-0 p-0 mt-2" 
          style={{ 
            width: '350px', 
            borderRadius: '16px', 
            zIndex: 1070, 
            position: 'absolute',
            left: 0,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0 fw-bold">مركز الإشعارات والتنبيهات</h6>
              <small className="opacity-75">{unreadCount} تنبيهات جديدة بانتظار اتخاذ إجراء</small>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="btn btn-sm btn-outline-light rounded-pill px-2 py-0"
                style={{ fontSize: '0.75rem' }}
              >
                تحديد كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div className="custom-scroll" style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="ti ti-bell-off fs-3 mb-2 d-block opacity-50"></i>
                لا توجد إشعارات جديدة حالياً
              </div>
            ) : (
              notifications.map((n) => (
                <Link 
                  key={n.id}
                  to={n.link}
                  onClick={() => setIsOpen(false)}
                  className="d-flex align-items-start gap-3 p-3 border-bottom text-decoration-none text-dark hover-bg-light"
                  style={{ backgroundColor: n.isRead ? '#ffffff' : '#f0f9ff' }}
                >
                  <div className={`p-2 rounded-circle mt-1 ${n.type === 'CHECKIN' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'}`}>
                    <i className={n.type === 'CHECKIN' ? 'ti ti-clipboard-check fs-5' : 'ti ti-credit-card fs-5'}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-dark">{n.title}</span>
                      <span className="badge bg-light text-muted border small" style={{ fontSize: '0.65rem' }}>{n.time}</span>
                    </div>
                    <p className="small text-muted mb-0 lh-base" style={{ fontSize: '0.78rem' }}>
                      {n.desc}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 text-center bg-light border-top">
            <Link to="/" onClick={() => setIsOpen(false)} className="small text-primary fw-bold text-decoration-none">
              الذهاب إلى لوحة التحكم الرئيسية ➜
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
