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

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const location = useLocation();

  return (
    <aside 
      className={`codex-sidebar d-flex flex-column justify-content-between ${isCollapsed ? 'collapsed' : ''}`} 
      style={{ 
        background: 'linear-gradient(180deg, #ffffff 0%, #fcfbfe 50%, #f8f6fd 100%)', 
        borderLeft: '1px solid rgba(221, 214, 254, 0.3)',
        boxShadow: '-4px 0 20px rgba(38, 28, 106, 0.02)',
        width: isCollapsed ? '72px' : '245px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 99,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
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
            padding: isCollapsed ? '10px 4px 8px 4px' : '8px 6px 4px 6px',
            width: '100%',
            borderBottom: '1px solid rgba(221, 214, 254, 0.25)',
            background: 'transparent',
            transition: 'all 0.2s ease'
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
            title="Z Coaching Platform"
          >
            {/* Athletic Dumbbell Z Logo */}
            <img 
              src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
              alt="Z Coaching" 
              style={{ 
                height: isCollapsed ? '32px' : '36px', 
                width: isCollapsed ? '32px' : '36px', 
                objectFit: 'contain', 
                margin: '0 auto',
                display: 'block',
                transition: 'all 0.2s ease'
              }} 
            />

            {!isCollapsed && (
              <span 
                style={{ 
                  fontSize: '0.68rem', 
                  letterSpacing: '2px', 
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'block',
                  marginTop: '2px',
                  lineHeight: '1.0',
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                COACHING
              </span>
            )}
          </Link>
        </div>

        {/* Grouped Menu List */}
        <div 
          className="codex-menuwrapper custom-scroll flex-grow-1" 
          data-simplebar 
          data-simplebar-direction="rtl" 
          data-simplebar-auto-hide="true"
          style={{ padding: isCollapsed ? '6px 4px' : '2px 4px', overflowY: 'auto' }}
        >
          {MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: isCollapsed ? '8px' : '2px' }}>
              {!isCollapsed ? (
                <div 
                  style={{ 
                    fontSize: '0.54rem', 
                    fontWeight: '700', 
                    color: '#94a3b8', 
                    padding: '1px 4px', 
                    letterSpacing: '0.2px',
                    marginBottom: '0px'
                  }}
                >
                  {group.groupTitle}
                </div>
              ) : (
                <div 
                  style={{ 
                    height: '1px', 
                    background: 'rgba(221, 214, 254, 0.4)', 
                    margin: '6px 12px 6px 12px' 
                  }} 
                />
              )}

              <ul className="codex-menu p-0 m-0 list-unstyled d-flex flex-column align-items-center">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path} style={{ marginBottom: isCollapsed ? '4px' : '0px', width: '100%' }}>
                      <Link 
                        to={item.path}
                        title={item.label}
                        className={`golden-sidebar-item d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} text-decoration-none transition-all ${isActive ? 'active' : ''}`}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? group.color : '#475569',
                          background: isActive ? `linear-gradient(90deg, ${group.color}08, ${group.color}12)` : 'transparent',
                          borderRadius: isCollapsed ? '8px' : '5px',
                          borderRight: !isCollapsed ? (isActive ? `2.5px solid ${group.color}` : '2.5px solid transparent') : 'none',
                          border: isCollapsed && isActive ? `1.5px solid ${group.color}40` : 'none',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? `0 1px 4px ${group.color}12` : 'none',
                          minHeight: isCollapsed ? '34px' : '25px',
                          padding: isCollapsed ? '4px' : '1px 6px',
                          width: '100%'
                        }}
                      >
                        <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''}`} style={{ gap: isCollapsed ? '0' : '6px', width: isCollapsed ? '100%' : 'auto' }}>
                          <div 
                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: isCollapsed ? '26px' : '18px',
                              height: isCollapsed ? '26px' : '18px',
                              borderRadius: isCollapsed ? '6px' : '3px',
                              background: isActive ? `linear-gradient(135deg, ${group.color}15, ${group.color}25)` : 'transparent',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <i 
                              className={`ti ${item.icon}`}
                              style={{ 
                                fontSize: isCollapsed ? '1.15rem' : '0.82rem',
                                color: isActive ? group.color : '#94a3b8',
                                transition: 'color 0.15s ease'
                              }}
                            ></i>
                          </div>
                          {!isCollapsed && <span>{item.label}</span>}
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

      {/* Fixed Bottom Footer (Toggle Button + Portal Link) */}
      <div 
        className={`p-2 ${isCollapsed ? 'px-1' : 'px-3'} d-flex flex-column align-items-center border-top flex-shrink-0`}
        style={{ 
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.02)',
          background: 'transparent',
          zIndex: 10 
        }}
      >
        {/* Sleek Centered Toggle Button (Compact icon only in center) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn d-flex align-items-center justify-content-center mb-2 p-0 rounded-3 shadow-xs"
          style={{
            width: '38px',
            height: '34px',
            background: '#f8fafc',
            border: '1.5px solid rgba(221, 214, 254, 0.8)',
            color: '#261c6a',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={isCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#261c6a';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#261c6a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#261c6a';
            e.currentTarget.style.borderColor = 'rgba(221, 214, 254, 0.8)';
          }}
        >
          <i className={`ti ${isCollapsed ? 'ti-layout-sidebar-right-expand' : 'ti-layout-sidebar-right-collapse'} fs-5`}></i>
        </button>

        {/* Client Portal Button */}
        <Link 
          to="/user-dashboard" 
          className={`btn ${isCollapsed ? 'rounded-circle p-0 d-flex align-items-center justify-content-center' : 'w-100 rounded-pill d-flex align-items-center justify-content-center gap-2'} fw-bold shadow-sm text-white`}
          style={{ 
            height: '38px',
            width: isCollapsed ? '38px' : '100%',
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
          {!isCollapsed && <span>بوابة العميل</span>}
        </Link>
      </div>
    </aside>
  );
}
