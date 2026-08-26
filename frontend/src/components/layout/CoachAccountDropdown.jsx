import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Users, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

export default function CoachAccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
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
      {/* 28px Interactive Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px 2px 4px',
          height: '28px',
          background: isOpen ? '#F1F5F9' : '#F8FAFC',
          border: isOpen ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        title="قائمة الحساب"
      >
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#0F172A',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          ك
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: 1.1 }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>كابتن كريم زكريا</span>
          <span style={{ fontSize: '8.5px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>المدرب الرئيسي</span>
        </div>
        <ChevronDown 
          size={12} 
          color="#94A3B8" 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease',
            marginRight: '1px'
          }} 
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            width: '240px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)',
            padding: '8px',
            zIndex: 1100
          }}
        >
          {/* Identity Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              marginBottom: '6px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              ك
            </div>
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>كابتن كريم زكريا</strong>
              <span style={{ fontSize: '10.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>coach@z-coaching.com</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                <ShieldCheck size={11} color="#059669" />
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#059669' }}>مشرف عام النظام</span>
              </div>
            </div>
          </div>

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
