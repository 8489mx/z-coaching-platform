import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Users, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { getStoredCoachConfig } from '../../utils/themeAndCoachConfig';

export default function CoachAccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setCoachConfig(e.detail);
      }
    };
    window.addEventListener('z-coach-config-updated', handleConfigUpdate);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('z-coach-config-updated', handleConfigUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('z_auth_token');
    localStorage.removeItem('z_coach_user');
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef} dir="rtl">
      {/* 32px Interactive Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 10px 3px 5px',
          height: '32px',
          background: isOpen ? '#F1F5F9' : '#F8FAFC',
          border: isOpen ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        title="قائمة الحساب"
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: coachConfig?.primaryColor || '#0F172A',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {((coachConfig?.coachName || 'K').trim().charAt(0) || 'K').toUpperCase()}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
          {coachConfig?.coachName || 'Karim Zakaria'}
        </span>
        <ChevronDown 
          size={13} 
          color="#94A3B8" 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease',
            marginRight: '2px'
          }} 
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 8px)',
            width: '210px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)',
            padding: '6px',
            zIndex: 1100
          }}
        >
          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              to="/customers"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '5px',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Users size={14} color="#64748B" />
              <span>إدارة المشتركين (CRM)</span>
            </Link>

            <Link
              to="/master-settings"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '5px',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Settings size={14} color="#64748B" />
              <span>إعدادات النظام العامة</span>
            </Link>

            <div style={{ height: '1px', background: '#E2E8F0', margin: '3px 0' }} />

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 8px',
                borderRadius: '5px',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} color="#DC2626" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
