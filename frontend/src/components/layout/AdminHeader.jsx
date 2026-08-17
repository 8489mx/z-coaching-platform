import React from 'react';
import { Link } from 'react-router-dom';
import NotificationsDropdown from '../NotificationsDropdown';

export default function AdminHeader({ searchTerm, onSearchChange, searchPlaceholder = "بحث عن متدرب بالاسم، الهاتف أو كود المشترك..." }) {
  return (
    <header className="codex-header">
      <div className="header-contian d-flex justify-content-between align-items-center">
        {/* Left Side: Search Bar */}
        <div className="header-left d-flex align-items-center flex-grow-1">
          <div className="input-group search-bar-wrapper" style={{ maxWidth: '440px' }}>
            <span className="input-group-text bg-light border-0 ps-3">
              <i className="ti ti-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-0 py-2 pe-3"
              placeholder={searchPlaceholder}
              style={{ fontSize: '0.86rem' }}
              value={searchTerm !== undefined ? searchTerm : ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side: Quick Action & Avatar */}
        <div className="header-right d-flex align-items-center justify-content-end gap-3 pe-2">
          <NotificationsDropdown />

          <Link to="/intake/form" className="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-bold shadow-sm">
            <i className="ti ti-user-plus me-1"></i> تسجيل متدرب جديد
          </Link>

          <div className="d-flex align-items-center gap-2 py-1 px-3 bg-light rounded-pill border ms-2">
            <img className="img-fluid rounded-circle border" src="/admin-dashboard_data/logo/z_coaching_logo.jpg" alt="Coach Logo" width="36" height="36" />
            <div className="d-none d-md-block text-end pe-1">
              <span className="fw-bold d-block text-dark lh-1" style={{ fontSize: '0.9rem' }}>لوحة تحكم المدرب</span>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Master Coach 👑</small>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
