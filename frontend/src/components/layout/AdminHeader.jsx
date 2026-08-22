import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';

export function AdminHeader({ 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder = "بحث بالاسم، الهاتف، أو الكود (#1)...",
  isCollapsed = false
}) {
  const searchInputRef = useRef(null);

  // Global Shortcut Listener for Search Focus: Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k' || e.key === 'K' || e.key === '1' || e.key === '*') {
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

  return (
    <header 
      className="codex-header" 
      style={{
        position: 'fixed',
        top: 0,
        right: isCollapsed ? '76px' : '250px',
        left: 0,
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 99,
        direction: 'rtl',
        transition: 'right 0.22s ease'
      }}
      dir="rtl"
    >
      {/* Right Side: Smart Search Box */}
      <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm !== undefined ? searchTerm : ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          style={{
            width: '100%',
            height: '42px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            paddingRight: '42px',
            paddingLeft: '65px',
            fontSize: '0.84rem',
            color: '#0F172A',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
        />
        <Search 
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: '#94A3B8',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'rgba(226, 232, 240, 0.85)',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '2px 6px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#475569',
            pointerEvents: 'none'
          }}
        >
          <span>CTRL</span>
          <span>K</span>
        </div>
      </div>

      {/* Left Side: Notifications & Coach Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NotificationsDropdown />

        <div style={{ width: '1px', height: '26px', background: '#E2E8F0' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.86rem',
              letterSpacing: '0.5px'
            }}
          >
            KZ
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              كابتن كريم زكريا
            </p>
            <span 
              style={{ 
                fontSize: '9.5px', 
                fontWeight: 700, 
                color: '#0284C7', 
                background: '#E0F2FE', 
                padding: '1px 6px', 
                borderRadius: '4px', 
                display: 'inline-block', 
                marginTop: '2px' 
              }}
            >
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export const Header = AdminHeader;
export default AdminHeader;
