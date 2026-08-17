import React from 'react';
import { Link } from 'react-router-dom';

export default function UserDashboardSidebar({ targetUserId, onOpenCheckin }) {
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
          <li className="menu-item active">
            <Link to="/user-dashboard">
              <div className="icon-item"><i className="ti ti-layout-dashboard"></i></div>
              <span>الرئيسية</span>
            </Link>
          </li>
          <li className="menu-item">
            <a href="#today-workout">
              <div className="icon-item"><i className="ti ti-barbell"></i></div>
              <span>جدول التمارين</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="#diet-plan">
              <div className="icon-item"><i className="ti ti-salad"></i></div>
              <span>الدايت والوجبات</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="#supplements-plan">
              <div className="icon-item"><i className="ti ti-pill"></i></div>
              <span>المكملات الغذائية</span>
            </a>
          </li>
          <li className="menu-item">
            <Link to={`/progress?user_id=${targetUserId}`}>
              <div className="icon-item"><i className="ti ti-chart-line"></i></div>
              <span>الرسوم البيانية والتطور</span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to={`/mobile?user_id=${targetUserId}`}>
              <div className="icon-item"><i className="ti ti-device-mobile"></i></div>
              <span>تطبيق الموبايل</span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/customers">
              <div className="icon-item"><i className="ti ti-users"></i></div>
              <span>بوابة الكابتن</span>
            </Link>
          </li>
          <li className="menu-item">
            <button 
              type="button"
              onClick={onOpenCheckin} 
              className="btn p-0 text-end w-100 d-flex align-items-center text-muted" 
              style={{ background: "none", border: "none" }}
            >
              <div className="icon-item"><i className="ti ti-clipboard-check"></i></div>
              <span>المتابعة الأسبوعية</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Bottom Card */}
      <div className="sidebarpro-sec mt-3 mb-4 mx-3 p-3 text-center" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.74rem' }}>
            <i className="ti ti-circle-filled me-1" style={{ fontSize: '7px' }}></i> الخطة الذكية نشطة
          </span>
        </div>
        <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Z Athlete Portal</h6>
        <p className="text-muted mb-3" style={{ fontSize: '0.74rem' }}>متابعة الالتزام وتحديثات المدرب</p>
        <button 
          type="button"
          onClick={onOpenCheckin} 
          className="btn btn-sm w-100 rounded-pill fw-bold text-white shadow-sm"
          style={{ 
            background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
            padding: '8px 14px',
            fontSize: '0.86rem',
            border: 'none'
          }}
        >
          <i className="ti ti-clipboard-check me-1"></i> إرسال المتابعة الأسبوعية
        </button>
      </div>
    </aside>
  );
}
