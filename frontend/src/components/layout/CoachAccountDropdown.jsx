import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, Users, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

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
      {/* Interactive Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 10px 3px 5px',
          background: isOpen ? '#F1F5F9' : '#F8FAFC',
          border: isOpen ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
        }}
        title="قائمة الحساب"
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#0F172A',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          ك
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: 1.15 }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>كابتن كريم زكريا</span>
          <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>المدرب الرئيسي</span>
        </div>
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
            width: '250px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)',
            padding: '8px',
            zIndex: 1100,
            animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {/* Identity Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              marginBottom: '6px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              ك
            </div>
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: 800 }}>كابتن كريم زكريا</strong>
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>coach@z-coaching.com</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <ShieldCheck size={12} color="#059669" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669' }}>مشرف عام النظام</span>
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
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Users size={15} color="#64748B" />
              <span>إدارة المشتركين (CRM)</span>
            </Link>

            <Link
              to="/master-settings"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Settings size={15} color="#64748B" />
              <span>إعدادات النظام العامة</span>
            </Link>

            <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }} />

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                color: '#DC2626',
                fontSize: '12.5px',
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
              <LogOut size={15} color="#DC2626" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
