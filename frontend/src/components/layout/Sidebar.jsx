import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { path: '/', label: 'لوحة التحكم الرئيسية', icon: 'ti-layout-dashboard' },
  { path: '/user-dashboard', label: 'واجهة المتدرب', icon: 'ti-user-circle' },
  { path: '/progress', label: 'تطور القياسات والصور', icon: 'ti-chart-line' },
  { path: '/subscriptions', label: 'الاشتراكات والمالية', icon: 'ti-credit-card' },
  { path: '/exercises', label: 'مكتبة التمارين', icon: 'ti-barbell' },
  { path: '/calculator', label: 'حاسبة الماكروز والسعرات', icon: 'ti-calculator' },
  { path: '/customers', label: 'إدارة المشتركين والأكواد', icon: 'ti-user-plus' },
  { path: '/profile', label: 'إعدادات وهوية المدرب', icon: 'ti-settings' },
  { path: '/mobile', label: 'تطبيق المتدرب (Mobile)', icon: 'ti-device-mobile' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="codex-sidebar">
      {/* Centered Brand & Logo */}
      <div 
        className="codex-brand" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center', 
          padding: '14px 10px 8px 10px',
          width: '100%',
          border: 'none',
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
          <img 
            src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" 
            alt="Z Logo" 
            style={{ 
              height: '76px', 
              width: '76px', 
              objectFit: 'contain', 
              margin: '0 auto',
              display: 'block'
            }} 
          />
          <span 
            style={{ 
              fontSize: '0.92rem', 
              letterSpacing: '4px', 
              fontWeight: '900',
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'block',
              marginTop: '-4px',
              lineHeight: '1.2',
              textAlign: 'center',
              width: '100%'
            }}
          >
            COACHING
          </span>
        </Link>
      </div>

      {/* Menu List */}
      <div className="codex-menuwrapper custom-scroll" data-simplebar>
        <ul className="codex-menu">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className={`menu-item ${isActive ? 'active' : ''}`}>
                <Link to={item.path}>
                  <div className="icon-item">
                    <i className={`ti ${item.icon}`}></i>
                  </div>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Pro Card */}
      <div 
        className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" 
        style={{ 
          background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0' 
        }}
      >
        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
          <span 
            className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" 
            style={{ fontSize: '0.74rem' }}
          >
            <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> محرك الذكاء نشط
          </span>
        </div>
        <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Coaching Platform</h6>
        <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>النظام يعمل بكفاءة 100%</p>
        <Link 
          to="/intake/form" 
          className="btn btn-sm w-100 fw-bold rounded-pill text-white shadow-sm"
          style={{ 
            background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
            border: 'none',
            fontSize: '0.8rem',
            padding: '7px 12px'
          }}
        >
          <i className="ti ti-sparkles me-1"></i> توليد خطة جديدة
        </Link>
      </div>
    </aside>
  );
}
