import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function UserDashboardHeader({ currentUser, targetUserId, clients = [] }) {
  const navigate = useNavigate();

  return (
    <header className="codex-header" style={{ height: '60px' }}>
      <div className="header-contian d-flex justify-content-between align-items-center h-100">
        
        {/* Left: Quick Search */}
        <div className="header-left d-flex align-items-center">
          <div className="input-group" style={{ maxWidth: "320px", height: "36px" }}>
            <span className="input-group-text pe-0 bg-white border" style={{ borderColor: '#e2e8f0', borderRadius: '0 10px 10px 0' }}>
              <i className="ti ti-search text-muted"></i>
            </span>
            <input 
              type="text" 
              placeholder="بحث في التمارين، الوجبات، الأصناف..." 
              className="form-control bg-white" 
              style={{ fontSize: '0.82rem', borderColor: '#e2e8f0', borderRadius: '10px 0 0 10px' }} 
            />
          </div>
        </div>

        {/* Right: Client Selector & Coach Actions */}
        <div className="header-right d-flex align-items-center justify-content-end gap-2 pe-2 flex-wrap">
          
          {/* 1. Client Switcher Dropdown (Allows switching to ANY client) */}
          {clients.length > 0 && (
            <div className="d-flex align-items-center gap-1 bg-white border rounded-pill px-2 py-1 shadow-xs" style={{ height: '34px', borderColor: '#e2e8f0' }}>
              <i className="ti ti-user-check text-primary" style={{ fontSize: '0.9rem' }}></i>
              <select 
                className="form-select form-select-sm border-0 bg-transparent py-0 pe-4 ps-1 fw-bold text-dark"
                style={{ fontSize: '0.78rem', cursor: 'pointer', maxWidth: '170px', outline: 'none', boxShadow: 'none' }}
                value={targetUserId}
                onChange={(e) => {
                  sessionStorage.setItem('z_active_client_code', e.target.value);
                  window.location.href = `/user-dashboard?user_id=${e.target.value}`;
                }}
                title="تبديل المتدرب المعروض في البوابة"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.client_code || c.id}>
                    {c.full_name || `متدرب ${c.client_code}`} ({c.client_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. PDF Download Button */}
          <Link 
            to={`/pdf?user_id=${targetUserId}`} 
            target="_blank" 
            className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
            style={{ height: '34px', fontSize: '0.78rem' }}
            title="تحميل خطة المتدرب كملف PDF"
          >
            <i className="ti ti-file-text"></i>
            <span className="d-none d-sm-inline">تحميل PDF</span>
          </Link>

          {/* 3. Switch to Coach Portal */}
          <Link 
            to="/" 
            className="btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm text-white"
            style={{ 
              height: '34px',
              background: '#261c6a',
              border: 'none',
              fontSize: '0.78rem',
              boxShadow: '0 3px 10px rgba(38, 28, 106, 0.28)'
            }}
            title="الانتقال إلى لوحة تحكم المدرب الرئيسية"
          >
            <i className="ti ti-arrows-exchange fs-6 text-light"></i>
            <span>لوحة الكابتن</span>
          </Link>

        </div>
      </div>
    </header>
  );
}
