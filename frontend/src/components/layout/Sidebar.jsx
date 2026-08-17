import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ZCoachingLogo from '../common/ZCoachingLogo';

const MENU_GROUPS = [
  {
    groupTitle: 'الرئيسية والمتابعة',
    items: [
      { path: '/', label: 'لوحة القيادة', icon: 'ti-layout-dashboard' },
      { path: '/intake/submissions', label: 'استمارات العملاء', icon: 'ti-clipboard-list' },
      { path: '/progress', label: 'القياسات والصور', icon: 'ti-chart-line' },
    ]
  },
  {
    groupTitle: 'البرامج والأدوات',
    items: [
      { path: '/exercises', label: 'مكتبة التمارين', icon: 'ti-barbell' },
      { path: '/calculator', label: 'حاسبة الماكروز', icon: 'ti-calculator' },
      { path: '/subscriptions', label: 'الاشتراكات والمالية', icon: 'ti-credit-card' },
    ]
  },
  {
    groupTitle: 'الإدارة والتطبيق',
    items: [
      { path: '/customers', label: 'إدارة المشتركين', icon: 'ti-user-plus' },
      { path: '/mobile', label: 'تطبيق العميل', icon: 'ti-device-mobile' },
      { path: '/profile', label: 'إعدادات المدرب', icon: 'ti-settings' },
    ]
  }
];

export default function Sidebar() {
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
        {/* Centered Athletic Brand & Logo */}
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
            to="/" 
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

        {/* Grouped Menu List (Clean Minimalist Active State) */}
        <div 
          className="codex-menuwrapper custom-scroll flex-grow-1" 
          data-simplebar 
          data-simplebar-direction="rtl" 
          data-simplebar-auto-hide="true"
          style={{ padding: '12px 10px', overflowY: 'auto' }}
        >
          {MENU_GROUPS.map((group, gIdx) => (
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
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path} className="mb-1">
                      <Link 
                        to={item.path}
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
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Compact Bottom Switcher */}
      <div 
        className="p-2 px-3 border-top border-light bg-white flex-shrink-0"
        style={{ 
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.02)',
          zIndex: 10 
        }}
      >
        <Link 
          to="/user-dashboard" 
          className="btn w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
          style={{ 
            height: '36px',
            background: '#261c6a', 
            border: 'none',
            fontSize: '0.8rem',
            letterSpacing: '0.2px',
            boxShadow: '0 3px 10px rgba(38, 28, 106, 0.25)'
          }}
          title="الانتقال إلى بوابة العميل"
        >
          <i className="ti ti-arrows-exchange fs-6 text-light"></i>
          <span>بوابة العميل</span>
        </Link>
      </div>
    </aside>
  );
}
