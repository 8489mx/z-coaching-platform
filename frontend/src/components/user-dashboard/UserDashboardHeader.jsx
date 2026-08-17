import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function UserDashboardHeader({ currentUser, targetUserId, clients = [] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const activeClient = clients.find(c => String(c.client_code || c.id) === String(targetUserId)) || 
                       currentUser || 
                       (clients.length > 0 ? clients[0] : null);

  const activeName = activeClient?.full_name || (currentUser?.full_name) || "أحمد سمير";

  const handleSelectClient = (clientCode) => {
    sessionStorage.setItem('z_active_client_code', clientCode);
    setDropdownOpen(false);
    window.location.href = `/user-dashboard?user_id=${clientCode}`;
  };

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

        {/* Right: Custom Luxury Client Selector & Actions */}
        <div className="header-right d-flex align-items-center justify-content-end gap-2 pe-2 flex-wrap">
          
          {/* 1. Custom Luxury Client Dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="btn bg-white border rounded-pill px-3 py-1 d-flex align-items-center gap-2 shadow-xs transition-all"
              style={{ 
                height: '36px', 
                borderColor: dropdownOpen ? '#261c6a' : '#e2e8f0',
                background: '#ffffff'
              }}
              title="انقر لتبديل المتدرب"
            >
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                style={{ width: '24px', height: '24px', background: '#f5f3ff', color: '#261c6a', fontSize: '0.75rem', border: '1px solid #ddd6fe' }}
              >
                {activeName[0]}
              </div>

              <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem', maxWidth: '140px' }}>
                {activeName}
              </span>

              <i 
                className={`ti ti-chevron-down text-muted flex-shrink-0 transition-transform`} 
                style={{ 
                  fontSize: '0.75rem',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              ></i>
            </button>

            {/* Floating Luxury Menu */}
            {dropdownOpen && (
              <div 
                className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-xl border overflow-hidden py-2"
                style={{ 
                  minWidth: '220px', 
                  zIndex: 1050, 
                  borderColor: '#e2e8f0',
                  boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0,0,0,0.02)',
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                <div className="px-3 py-1 pb-2 border-bottom mb-1" style={{ borderColor: '#f1f5f9' }}>
                  <small className="text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>
                    اختر المتدرب لعرض خطته:
                  </small>
                </div>

                <div className="d-flex flex-column gap-1 px-1" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {clients.map((c) => {
                    const isSelected = String(c.client_code || c.id) === String(targetUserId);
                    const name = c.full_name || `متدرب ${c.client_code}`;
                    const code = c.client_code || c.id;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(code)}
                        className="btn btn-sm text-start w-100 px-3 py-2 d-flex align-items-center justify-content-between rounded-3 border-0 transition-all"
                        style={{
                          background: isSelected ? '#f5f3ff' : 'transparent',
                          color: isSelected ? '#261c6a' : '#334155',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              fontSize: '0.72rem',
                              background: isSelected ? '#261c6a' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#64748b'
                            }}
                          >
                            {name[0]}
                          </div>
                          <span className={isSelected ? 'fw-bold' : 'fw-medium'}>{name}</span>
                        </div>

                        {isSelected && (
                          <i className="ti ti-check text-primary fw-bold" style={{ fontSize: '0.85rem' }}></i>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. PDF Download Button */}
          <Link 
            to={`/pdf?user_id=${targetUserId}`} 
            target="_blank" 
            className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
            style={{ height: '36px', fontSize: '0.78rem' }}
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
              height: '36px',
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
