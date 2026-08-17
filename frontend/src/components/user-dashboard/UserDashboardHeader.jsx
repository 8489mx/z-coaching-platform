import React from 'react';
import { Link } from 'react-router-dom';

export default function UserDashboardHeader({ currentUser, targetUserId }) {
  return (
    <header className="codex-header">
      <div className="header-contian d-flex justify-content-between align-items-center">
        <div className="header-left d-flex align-items-center">
          <div className="input-group" style={{ minWidth: "320px" }}>
            <span className="input-group-text pe-0"><i className="ti ti-search text-muted"></i></span>
            <input type="text" placeholder="بحث في التمارين، الوجبات، الأصناف..." className="form-control" />
          </div>
        </div>

        <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
          <ul className="nav-iconlist mb-0 d-flex align-items-center gap-2 list-unstyled">
            <li>
              <div className="navicon-wrap action-dark">
                <i className="ti ti-moon icon-dark"></i>
              </div>
            </li>
            <li className="action-menu">
              <div className="navicon-wrap notiicon-iconwrap">
                <i className="ti ti-bell-ringing"></i>
                <div className="noti-count"></div>
              </div>
            </li>
          </ul>

          <Link 
            to={`/pdf?user_id=${targetUserId}`} 
            target="_blank"
            className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 fw-bold me-2"
          >
            <i className="ti ti-file-text me-1"></i> تحميل الخطة PDF
          </Link>

          <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
            <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/avtar/profile.png" alt="User Logo" width="36" height="36" />
            <div className="d-none d-md-block text-end pe-1">
              <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: "0.9rem" }}>{currentUser?.full_name || "أحمد سمير"}</span>
              <small className="text-muted" style={{ fontSize: "0.72rem" }}>مشترك بريميوم 👑</small>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
