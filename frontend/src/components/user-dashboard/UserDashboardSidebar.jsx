import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ZCoachingLogo from '../common/ZCoachingLogo';

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

        {/* Menu List */}
        <div 
          className="codex-menuwrapper custom-scroll flex-grow-1" 
          data-simplebar 
          data-simplebar-direction="rtl" 
          data-simplebar-auto-hide="true"
          style={{ padding: '12px 10px', overflowY: 'auto' }}
        >
          <div className="mb-2">
            <div 
              style={{ 
                fontSize: '0.66rem', 
                fontWeight: '700', 
                color: '#94a3b8', 
                padding: '4px 10px', 
                letterSpacing: '0.3px'
              }}
            >
              الخطة اليومية
            </div>

            <ul className="p-0 m-0 list-unstyled">
              <li className="mb-1">
                <Link 
                  to="/user-dashboard"
                  className="golden-sidebar-item d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none active"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: '#261c6a',
                    background: '#f5f3ff',
                    borderRight: '3px solid #261c6a',
                    borderRadius: '8px'
                  }}
                >
                  <i className="ti ti-layout-dashboard" style={{ fontSize: '1.1rem', color: '#261c6a' }}></i>
                  <span>الرئيسية</span>
                </Link>
              </li>

              <li className="mb-1">
                <a 
                  href="#today-workout"
                  className="golden-sidebar-item d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none text-secondary"
                  style={{ fontSize: '0.82rem', fontWeight: '500' }}
                >
                  <i className="ti ti-barbell text-muted" style={{ fontSize: '1.1rem' }}></i>
                  <span>جدول التمارين</span>
                </a>
              </li>

              <li className="mb-1">
                <a 
                  href="#diet-plan"
                  className="golden-sidebar-item d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none text-secondary"
                  style={{ fontSize: '0.82rem', fontWeight: '500' }}
                >
                  <i className="ti ti-salad text-muted" style={{ fontSize: '1.1rem' }}></i>
                  <span>الدايت والوجبات</span>
                </a>
              </li>

              <li className="mb-1">
                <a 
                  href="#supplements-plan"
                  className="golden-sidebar-item d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none text-secondary"
                  style={{ fontSize: '0.82rem', fontWeight: '500' }}
                >
                  <i className="ti ti-pill text-muted" style={{ fontSize: '1.1rem' }}></i>
                  <span>المكملات</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="mb-2">
            <div 
              style={{ 
                fontSize: '0.66rem', 
                fontWeight: '700', 
                color: '#94a3b8', 
                padding: '4px 10px', 
                letterSpacing: '0.3px'
              }}
            >
              المتابعة والملف
            </div>

            <ul className="p-0 m-0 list-unstyled">
              <li className="mb-1">
                <button
                  type="button"
                  onClick={onOpenCheckin}
                  className="btn w-100 text-start d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0 bg-transparent text-secondary"
                  style={{ fontSize: '0.82rem', fontWeight: '500' }}
                >
                  <i className="ti ti-clipboard-check text-success" style={{ fontSize: '1.1rem' }}></i>
                  <span>إرسال المتابعة</span>
                </button>
              </li>

              <li className="mb-1">
                <Link 
                  to={`/progress?user_id=${targetUserId}`}
                  className="golden-sidebar-item d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none text-secondary"
                  style={{ fontSize: '0.82rem', fontWeight: '500' }}
                >
                  <i className="ti ti-chart-line text-muted" style={{ fontSize: '1.1rem' }}></i>
                  <span>القياسات والصور</span>
                </Link>
              </li>

              <li className="mb-1">
                <Link 
                  to={`/pdf?user_id=${targetUserId}`}
                  target="_blank"
                  className="golden-sidebar-item d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none text-secondary"
                  style={{ fontSize: '0.82rem', fontWeight: '500' }}
                >
                  <i className="ti ti-file-text text-danger" style={{ fontSize: '1.1rem' }}></i>
                  <span>تحميل الخطة PDF</span>
                </Link>
              </li>
            </ul>
          </div>
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
