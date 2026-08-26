import React, { useEffect, useRef } from 'react';
import { Search, UserPlus, Bell } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';

export function AdminHeader({ 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder = "بحث بالاسم، الهاتف، أو الكود (#1)...",
  isCollapsed = false,
  onOpenNewClient
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k' || e.key === 'K') {
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
      className="global-app-toolbar" 
      style={{
        height: '60px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 90,
        direction: 'rtl',
        flexShrink: 0
      }}
      dir="rtl"
    >
      {/* Right Side: Smart Search Box & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '460px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm !== undefined ? searchTerm : ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              paddingRight: '38px',
              paddingLeft: '65px',
              fontSize: '13px',
              color: '#0F172A',
              outline: 'none',
              transition: 'all 0.16s ease'
            }}
          />
          <Search 
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#94A3B8',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: '#E2E8F0',
              border: '1px solid #CBD5E1',
              borderRadius: '4px',
              padding: '2px 5px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#475569',
              pointerEvents: 'none'
            }}
          >
            <span>Ctrl K</span>
          </div>
        </div>
      </div>

      {/* Left Side: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onOpenNewClient && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenNewClient}
            style={{
              height: '38px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={15} />
            <span>كود مشترك جديد</span>
          </button>
        )}

        <NotificationsDropdown />

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px 4px 6px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '20px'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #170c5c 0%, #10003b 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ك
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>كريم زكريا</span>
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>المدرب الرئيسي</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export const Header = AdminHeader;
export default AdminHeader;
