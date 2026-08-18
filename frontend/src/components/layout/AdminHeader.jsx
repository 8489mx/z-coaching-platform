import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationsDropdown from '../NotificationsDropdown';
import NewClientQuickModal from '../modals/NewClientQuickModal';

export default function AdminHeader({ 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder = "بحث بالاسم، الهاتف، أو اكتب #كود المشترك (مثل #4)...",
  isCollapsed = false,
  onToggleSidebar
}) {
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [coachProfile, setCoachProfile] = useState({
    coach_name: 'كريم زكريا',
    email: 'info@karimzakaria.com'
  });
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Load coach profile from localStorage
  const loadCoachProfile = () => {
    try {
      const stored = localStorage.getItem('fitnexus_coach_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.coach_name) {
          setCoachProfile(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCoachProfile();
    window.addEventListener('coach_settings_updated', loadCoachProfile);
    window.addEventListener('storage', loadCoachProfile);
    return () => {
      window.removeEventListener('coach_settings_updated', loadCoachProfile);
      window.removeEventListener('storage', loadCoachProfile);
    };
  }, []);

  // Global Shortcut Listener for Search Focus: Ctrl+1, Ctrl+*, or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === '1' || 
          e.key === '*' || 
          e.key === 'k' || 
          e.key === 'K' || 
          e.code === 'Digit1' || 
          e.code === 'Numpad1' || 
          e.code === 'NumpadMultiply' || 
          e.code === 'KeyK'
        ) {
          e.preventDefault();
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('z_coach_token');
    localStorage.removeItem('z_coach_user');
    setIsProfileDropdownOpen(false);
    navigate('/client/login');
  };

  return (
    <>
      <header className="codex-header" style={{ zIndex: 1010 }}>
        <div className="header-contian d-flex justify-content-between align-items-center">
          
          {/* Right Side in RTL: Global Search Input */}
          <div className="header-left d-flex align-items-center flex-grow-1">
            <div className="input-group search-bar-wrapper position-relative" style={{ maxWidth: '440px' }}>
              <span className="input-group-text bg-light border-0 ps-3">
                <i className="ti ti-search text-muted"></i>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control bg-light border-0 py-2 ps-5 pe-2"
                placeholder={searchPlaceholder}
                style={{ fontSize: '0.86rem' }}
                value={searchTerm !== undefined ? searchTerm : ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
              {/* Shortcut badge on the LEFT in RTL */}
              <span 
                className="position-absolute start-0 top-50 translate-middle-y ms-3 badge bg-white border text-muted px-2 py-1 font-monospace d-none d-sm-inline-block shadow-xs"
                style={{ fontSize: '0.68rem', borderRadius: '6px', pointerEvents: 'none', zIndex: 5 }}
                title="اضغط Ctrl + 1 أو Ctrl + * للبحث الفوري"
              >
                Ctrl 1
              </span>
            </div>
          </div>

          {/* Left Side in RTL: Manzuma Deep Midnight Violet Action + Notifications + Profile */}
          <div className="header-right d-flex align-items-center justify-content-end gap-2 flex-shrink-0">
            
            {/* Quick Action: New Client Button (Manzuma Midnight Violet #261c6a) */}
            <button 
              type="button"
              onClick={() => setIsNewClientModalOpen(true)}
              className="btn btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm d-flex align-items-center gap-1 text-white" 
              style={{ 
                height: '34px',
                background: '#261c6a', 
                border: 'none',
                fontSize: '0.8rem',
                boxShadow: '0 3px 10px rgba(38, 28, 106, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="ti ti-plus fs-6"></i>
              <span>عميل جديد</span>
            </button>

            {/* Notifications Dropdown */}
            <NotificationsDropdown />

            {/* Clickable Coach Profile Dropdown */}
            <div className="position-relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="d-flex align-items-center gap-2 px-3 rounded-pill border transition-all"
                style={{ 
                  height: '38px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: isProfileDropdownOpen ? '#f5f3ff' : '#ffffff',
                  borderColor: isProfileDropdownOpen ? '#c4b5fd' : '#e2e8f0',
                  boxShadow: isProfileDropdownOpen ? '0 2px 8px rgba(38,28,106,0.1)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
                role="button"
                tabIndex={0}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs flex-shrink-0" 
                  style={{ 
                    width: '26px', 
                    height: '26px', 
                    background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)',
                    fontSize: '0.78rem'
                  }}
                >
                  Z
                </div>
                <span className="d-none d-md-inline-block fw-bold text-dark lh-base" style={{ fontSize: '0.84rem', letterSpacing: '-0.2px' }}>
                  {coachProfile.coach_name?.startsWith('كابتن') ? coachProfile.coach_name : `كابتن ${coachProfile.coach_name || 'Z Coaching'}`}
                </span>
                <i 
                  className={`ti ti-chevron-down text-muted small transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                  style={{ fontSize: '0.74rem', transition: 'transform 0.2s ease' }}
                ></i>
              </div>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div 
                  className="dropdown-menu show shadow-lg border-0 py-2 mt-2"
                  style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: '240px',
                    borderRadius: '16px',
                    zIndex: 1050,
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)'
                  }}
                  dir="rtl"
                >
                  <div className="px-3 py-2 border-bottom border-light mb-1">
                    <strong className="d-block text-dark small">{coachProfile.coach_name || 'كابتن Z Coaching'}</strong>
                    <small className="text-muted" style={{ fontSize: '0.74rem' }}>{coachProfile.email || 'coach@zcoaching.com'}</small>
                  </div>

                  <Link 
                    to="/profile" 
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-dark small"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <i className="ti ti-user-circle fs-5" style={{ color: '#261c6a' }}></i>
                    <span>الملف الشخصي وإعدادات الحساب</span>
                  </Link>

                  <Link 
                    to="/profile" 
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-dark small"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <i className="ti ti-palette fs-5 text-secondary"></i>
                    <span>هوية المدرب والشعار</span>
                  </Link>

                  <Link 
                    to="/subscriptions" 
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-dark small"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <i className="ti ti-credit-card fs-5 text-secondary"></i>
                    <span>الاشتراكات والمالية</span>
                  </Link>

                  <div className="dropdown-divider my-1"></div>

                  <Link 
                    to="/user-dashboard" 
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-dark small"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <i className="ti ti-arrows-exchange fs-5" style={{ color: '#261c6a' }}></i>
                    <span>التبديل إلى بوابة العميل</span>
                  </Link>

                  <div className="dropdown-divider my-1"></div>

                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger small w-100 border-0 bg-transparent"
                  >
                    <i className="ti ti-logout fs-5"></i>
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* New Client Modal */}
      <NewClientQuickModal 
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />
    </>
  );
}
