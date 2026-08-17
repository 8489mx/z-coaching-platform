import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const USER_MENU_GROUPS = [
  {
    groupTitle: 'الخطة اليومية',
    items: [
      { id: 'dashboard', to: (uid) => `/user-dashboard?user_id=${uid}`, label: 'الرئيسية', icon: 'ti-layout-dashboard' },
      { id: 'workout', href: '#today-workout', label: 'جدول التمارين', icon: 'ti-barbell' },
      { id: 'meals', href: '#diet-plan', label: 'الدايت والوجبات', icon: 'ti-salad' },
      { id: 'supplements', href: '#supplements-plan', label: 'المكملات الغذائية', icon: 'ti-pill' },
    ]
  },
  {
    groupTitle: 'المتابعة والملف',
    items: [
      { id: 'checkin', action: 'checkin', label: 'إرسال المتابعة', icon: 'ti-clipboard-check' },
      { id: 'progress', to: (uid) => `/progress?user_id=${uid}&mode=client`, label: 'القياسات والصور', icon: 'ti-chart-line' },
      { id: 'pdf', to: (uid) => `/pdf?user_id=${uid}`, target: '_blank', label: 'تحميل الخطة PDF', icon: 'ti-file-text' },
    ]
  }
];

export default function UserDashboardSidebar({ targetUserId, onOpenCheckin }) {
  const location = useLocation();

  return (
    <aside 
      className="codex-sidebar d-flex flex-column justify-content-between" 
      style={{ 
        background: '#ffffff', 
        borderLeft: '1px solid #edf2f7',
        width: '245px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 99
      }}
    >
      <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        {/* Centered Athletic Brand & Logo (Exact match with coach sidebar) */}
        <div 
          className="codex-brand flex-shrink-0" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center', 
            padding: '14px 10px 10px 10px',
            width: '100%',
            borderBottom: '1px solid #f8fafc',
            background: 'transparent'
          }}
        >
          <Link 
            to="/user-dashboard" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textDecoration: 'none',
              width: '100%',
              margin: '0 auto'
            }}
          >
            {/* Athletic Dumbbell Z Logo */}
            <img 
              src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
              alt="Z Coaching" 
              style={{ 
                height: '64px', 
                width: '64px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block'
              }} 
            />

            <span 
              style={{ 
                fontSize: '0.84rem', 
                letterSpacing: '3.5px', 
                fontWeight: '900',
                background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '4px',
                lineHeight: '1.2',
                textAlign: 'center',
                width: '100%'
              }}
            >
              COACHING
            </span>
          </Link>
        </div>

        {/* Grouped Menu List (Identical typography, weights, and active state to coach sidebar) */}
        <div 
          className="codex-menuwrapper custom-scroll flex-grow-1" 
          data-simplebar 
          data-simplebar-direction="rtl" 
          data-simplebar-auto-hide="true"
          style={{ padding: '12px 10px', overflowY: 'auto' }}
        >
          {USER_MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="mb-2">
              <div 
                style={{ 
                  fontSize: '0.66rem', 
                  fontWeight: '700', 
                  color: '#94a3b8', 
                  padding: '4px 10px', 
                  letterSpacing: '0.3px'
                }}
              >
                {group.groupTitle}
              </div>

              <ul className="codex-menu p-0 m-0 list-unstyled">
                {group.items.map((item) => {
                  const isActive = item.id === 'dashboard'
                    ? (location.pathname === '/user-dashboard' || location.pathname === '/user')
                    : item.id === 'progress'
                    ? location.pathname.startsWith('/progress')
                    : false;
                  return (
                    <li key={item.id} className="mb-1">
                      {item.to ? (
                        <Link 
                          to={typeof item.to === 'function' ? item.to(targetUserId) : item.to}
                          target={item.target}
                          className={`golden-sidebar-item d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-decoration-none transition-all ${isActive ? 'active' : ''}`}
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: isActive ? '700' : '500',
                            color: isActive ? '#261c6a' : '#475569',
                            background: isActive ? '#f5f3ff' : 'transparent',
                            borderRadius: '8px',
                            borderRight: isActive ? '3px solid #261c6a' : '3px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i 
                              className={`ti ${item.icon}`}
                              style={{ 
                                fontSize: '1.1rem',
                                color: isActive ? '#261c6a' : '#94a3b8',
                                transition: 'color 0.15s ease'
                              }}
                            ></i>
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      ) : item.action === 'checkin' ? (
                        <button
                          type="button"
                          onClick={onOpenCheckin}
                          className="golden-sidebar-item w-100 d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-decoration-none border-0 transition-all text-start"
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: '500',
                            color: '#475569',
                            background: 'transparent',
                            borderRadius: '8px',
                            borderRight: '3px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i 
                              className={`ti ${item.icon}`}
                              style={{ 
                                fontSize: '1.1rem',
                                color: '#16a34a',
                                transition: 'color 0.15s ease'
                              }}
                            ></i>
                            <span>{item.label}</span>
                          </div>
                        </button>
                      ) : (
                        <a 
                          href={location.pathname.startsWith('/user-dashboard') || location.pathname === '/user' ? item.href : `/user-dashboard?user_id=${targetUserId}${item.href}`}
                          className="golden-sidebar-item d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-decoration-none transition-all"
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: '500',
                            color: '#475569',
                            background: 'transparent',
                            borderRadius: '8px',
                            borderRight: '3px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i 
                              className={`ti ${item.icon}`}
                              style={{ 
                                fontSize: '1.1rem',
                                color: '#94a3b8',
                                transition: 'color 0.15s ease'
                              }}
                            ></i>
                            <span>{item.label}</span>
                          </div>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Compact Bottom Switcher (Exact match with coach sidebar) */}
      <div 
        className="p-2 px-3 border-top border-light bg-white flex-shrink-0"
        style={{ 
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.02)',
          zIndex: 10 
        }}
      >
        <Link 
          to="/" 
          className="btn w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
          style={{ 
            height: '36px',
            background: '#261c6a', 
            border: 'none',
            fontSize: '0.8rem',
            letterSpacing: '0.2px',
            boxShadow: '0 3px 10px rgba(38, 28, 106, 0.25)'
          }}
          title="الانتقال إلى لوحة تحكم الكابتن"
        >
          <i className="ti ti-arrows-exchange fs-6 text-light"></i>
          <span>لوحة الكابتن</span>
        </Link>
      </div>
    </aside>
  );
}
