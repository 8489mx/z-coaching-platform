import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ZCoachingLogo from '../common/ZCoachingLogo';

const MENU_GROUPS = [
  {
    groupTitle: 'الرئيسية والمتابعة',
    color: '#261c6a',
    items: [
      { path: '/', label: 'لوحة القيادة', icon: 'ti-layout-dashboard' },
      { path: '/intake/submissions', label: 'استمارات العملاء', icon: 'ti-clipboard-list' },
      { path: '/progress', label: 'القياسات والصور', icon: 'ti-chart-line' },
    ]
  },
  {
    groupTitle: 'البرامج والأدوات',
    color: '#0891b2',
    items: [
      { path: '/exercises', label: 'مكتبة التمارين', icon: 'ti-barbell' },
      { path: '/calculator', label: 'حاسبة الماكروز', icon: 'ti-calculator' },
      { path: '/subscriptions', label: 'الاشتراكات والمالية', icon: 'ti-credit-card' },
    ]
  },
  {
    groupTitle: 'الإدارة والتحكم',
    color: '#059669',
    items: [
      { path: '/customers', label: 'إدارة المشتركين', icon: 'ti-user-plus' },
      { path: '/master-settings', label: 'داش الداش', icon: 'ti-settings-cog' },
      { path: '/mobile', label: 'تطبيق العميل', icon: 'ti-device-mobile' },
      { path: '/profile', label: 'الملف الشخصي للمدرب', icon: 'ti-settings' },
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside 
      className="codex-sidebar d-flex flex-column justify-content-between" 
      style={{ 
        background: 'linear-gradient(180deg, #ffffff 0%, #fcfbfe 50%, #f8f6fd 100%)', 
        borderLeft: '1px solid rgba(221, 214, 254, 0.3)',
        boxShadow: '-4px 0 20px rgba(38, 28, 106, 0.02)',
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
            padding: '10px 8px 6px 8px',
            width: '100%',
            borderBottom: '1px solid rgba(221, 214, 254, 0.25)',
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
                height: '48px', 
                width: '48px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block'
              }} 
            />

            <span 
              style={{ 
                fontSize: '0.76rem', 
                letterSpacing: '3px', 
                fontWeight: '900',
                background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '2px',
                lineHeight: '1.1',
                textAlign: 'center',
                width: '100%'
              }}
            >
              COACHING
            </span>
          </Link>
        </div>

        {/* Grouped Menu List (Clean Minimalist Active State - Compact Spacing) */}
        <div 
          className="codex-menuwrapper custom-scroll flex-grow-1" 
          data-simplebar 
          data-simplebar-direction="rtl" 
          data-simplebar-auto-hide="true"
          style={{ padding: '6px 8px', overflowY: 'auto' }}
        >
          {MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="mb-2">
              <div 
                style={{ 
                  fontSize: '0.62rem', 
                  fontWeight: '700', 
                  color: '#94a3b8', 
                  padding: '2px 8px', 
                  letterSpacing: '0.2px',
                  marginBottom: '2px'
                }}
              >
                {group.groupTitle}
              </div>

              <ul className="codex-menu p-0 m-0 list-unstyled">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path} style={{ marginBottom: '2px' }}>
                      <Link 
                        to={item.path}
                        className={`golden-sidebar-item d-flex align-items-center justify-content-between px-2 py-1 text-decoration-none transition-all ${isActive ? 'active' : ''}`}
                        style={{
                          fontSize: '0.79rem',
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? group.color : '#475569',
                          background: isActive ? `linear-gradient(90deg, ${group.color}08, ${group.color}12)` : 'transparent',
                          borderRadius: '8px',
                          borderRight: isActive ? `3px solid ${group.color}` : '3px solid transparent',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isActive ? `0 2px 6px ${group.color}15` : 'none',
                          minHeight: '34px'
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: isActive ? `linear-gradient(135deg, ${group.color}15, ${group.color}25)` : 'transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i 
                              className={`ti ${item.icon}`}
                              style={{ 
                                fontSize: '0.94rem',
                                color: isActive ? group.color : '#94a3b8',
                                transition: 'color 0.2s ease'
                              }}
                            ></i>
                          </div>
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
        className="p-2 px-3 border-top flex-shrink-0"
        style={{ 
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.02)',
          background: 'transparent',
          zIndex: 10 
        }}
      >
        <Link 
          to="/user-dashboard" 
          className="btn w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
          style={{ 
            height: '38px',
            background: 'linear-gradient(135deg, #261c6a 0%, #4c1d95 100%)', 
            border: 'none',
            fontSize: '0.8rem',
            letterSpacing: '0.3px',
            boxShadow: '0 4px 15px rgba(38, 28, 106, 0.3)',
            transition: 'all 0.3s ease'
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
