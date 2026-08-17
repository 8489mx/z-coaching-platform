import React from 'react';
import { Link } from 'react-router-dom';

export default function UserDashboardHeader({ currentUser, targetUserId }) {
  return (
    <header className="codex-header">
      <div className="header-contian d-flex justify-content-between align-items-center">
        <div className="header-left d-flex align-items-center">
          <div className="input-group" style={{ maxWidth: "340px", height: "38px" }}>
            <span className="input-group-text pe-0"><i className="ti ti-search text-muted"></i></span>
            <input type="text" placeholder="بحث في التمارين، الوجبات، الأصناف..." className="form-control" style={{ fontSize: '0.82rem' }} />
          </div>
        </div>

        <div className="header-right d-flex align-items-center justify-content-end gap-2 pe-2 flex-wrap">
          {/* Dedicated Switcher to Coach Portal */}
          <Link 
            to="/" 
            className="btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm text-white"
            style={{ 
              height: '34px',
              background: '#261c6a',
              border: 'none',
              fontSize: '0.8rem',
              boxShadow: '0 3px 10px rgba(38, 28, 106, 0.28)'
            }}
            title="الانتقال إلى لوحة تحكم المدرب"
          >
            <i className="ti ti-arrows-exchange fs-6 text-light"></i>
            <span className="d-none d-sm-inline">لوحة الكابتن</span>
          </Link>

          <Link 
            to={`/pdf?user_id=${targetUserId}`} 
            target="_blank"
            className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
            style={{ height: '34px', fontSize: '0.8rem' }}
          >
            <i className="ti ti-file-text me-1"></i> تحميل PDF
          </Link>

          <div className="d-flex align-items-center gap-2 py-1 px-2 bg-light rounded-pill border ms-1" style={{ height: '34px' }}>
            <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/avtar/profile.png" alt="User Logo" width="26" height="26" />
            <div className="d-none d-md-block text-end pe-1">
              <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: "0.8rem" }}>{currentUser?.full_name || "أحمد سمير"}</span>
              <small className="text-muted" style={{ fontSize: "0.66rem" }}>مشترك بريميوم</small>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
