import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function UserDashboardHeader({ 
  currentUser, 
  targetUserId, 
  clients = [],
  isCollapsed = false,
  onToggleSidebar
}) {
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

  const activeClient = currentUser || 
                       clients.find(c => String(c.client_code || c.id) === String(targetUserId)) || 
                       (clients.length > 0 ? clients[0] : null);

  const activeName = currentUser?.full_name || 
                     activeClient?.full_name || 
                     (activeClient?.client_code ? `متدرب #${activeClient.client_code}` : (targetUserId ? `متدرب #${targetUserId}` : "المتدرب"));

  const handleSelectClient = (clientCode) => {
    sessionStorage.setItem('z_active_client_code', clientCode);
    setDropdownOpen(false);
    window.location.href = `/user-dashboard?user_id=${clientCode}`;
  };

  return (
    <header className="codex-header" style={{ height: '60px' }}>
      <div className="header-contian d-flex justify-content-between align-items-center h-100">
        
        {/* Right Side in RTL: Quick Search */}
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
        <div className="header-right d-flex align-items-center justify-content-end gap-2.5 pe-2 flex-wrap">
          
          {/* 1. Custom Luxury Client Dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="btn bg-white border d-flex align-items-center gap-2 shadow-xs transition-all"
              style={{ 
                minHeight: '38px', 
                borderRadius: '10px',
                borderColor: dropdownOpen ? '#1e144f' : '#e2e8f0',
                background: '#ffffff',
                padding: '6px 14px',
                lineHeight: '1.5'
              }}
              title="انقر لتبديل المتدرب"
            >
              <div 
                className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                style={{ width: '24px', height: '24px', background: '#E5F0FF', color: '#1e144f', fontSize: '0.78rem', border: '1px solid #BAE6FD' }}
              >
                {activeName[0]}
              </div>

              <span 
                className="fw-bold text-dark" 
                style={{ 
                  fontSize: '0.84rem', 
                  maxWidth: '160px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.6',
                  padding: '2px 0',
                  display: 'inline-block'
                }}
              >
                {activeName}
              </span>

              <i 
                className={`ti ti-chevron-down text-muted flex-shrink-0 transition-transform`} 
                style={{ 
                  fontSize: '0.74rem',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              ></i>
            </button>

            {/* Floating Luxury Menu */}
            {dropdownOpen && (
              <div 
                className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-xl border overflow-hidden py-2"
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
                        className="btn btn-sm text-start w-100 px-3 py-2 d-flex align-items-center justify-content-between rounded-2 border-0 transition-all"
                        style={{
                          background: isSelected ? '#E5F0FF' : 'transparent',
                          color: isSelected ? '#1e144f' : '#334155',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-2 d-flex align-items-center justify-content-center fw-bold"
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              fontSize: '0.72rem',
                              background: isSelected ? '#1e144f' : '#f1f5f9',
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

          {/* 2. PDF Download Button (Clean Executive Card Button) */}
          <Link 
            to={`/pdf?user_id=${targetUserId}`} 
            target="_blank" 
            className="btn btn-white bg-white border px-3 fw-bold d-flex align-items-center gap-1.5 shadow-xs transition-all"
            style={{ 
              height: '38px', 
              borderRadius: '10px', 
              fontSize: '0.8rem',
              color: '#0f172a',
              borderColor: '#e2e8f0'
            }}
            title="تحميل خطة المتدرب كملف PDF"
          >
            <i className="ti ti-file-text text-danger fs-6"></i>
            <span className="d-none d-sm-inline">تحميل PDF</span>
          </Link>

          {/* 3. Switch to Coach Portal (Luxury Dark Indigo Action Button) */}
          <Link 
            to="/" 
            className="btn px-3.5 fw-bold d-flex align-items-center gap-2 text-white transition-all"
            style={{ 
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e144f 0%, #2e2070 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.8rem',
              boxShadow: '0 3px 10px rgba(30, 20, 79, 0.25)'
            }}
            title="الانتقال إلى لوحة تحكم المدرب الرئيسية"
          >
            <i className="ti ti-arrows-exchange fs-6 text-white-50"></i>
            <span>لوحة الكابتن</span>
          </Link>

        </div>
      </div>
    </header>
  );
}
