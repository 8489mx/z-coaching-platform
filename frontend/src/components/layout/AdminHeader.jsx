import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCw, Maximize2, Search } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';
import CoachAccountDropdown from './CoachAccountDropdown';

export function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return [{ label: 'الرئيسية' }, { label: 'لوحة التحكم اليومية' }];
    if (path.includes('/intake')) return [{ label: 'الاستبيانات' }, { label: 'استمارات العملاء' }];
    if (path.includes('/checkin')) return [{ label: 'المتابعة' }, { label: 'مراجعة التقييمات' }];
    if (path.includes('/customers')) return [{ label: 'العملاء' }, { label: 'إدارة المشتركين' }];
    if (path.includes('/subscriptions')) return [{ label: 'المالية' }, { label: 'الباقات والاشتراكات' }];
    if (path.includes('/exercises')) return [{ label: 'التمارين' }, { label: 'مكتبة التمارين' }];
    if (path.includes('/calculator')) return [{ label: 'التغذية' }, { label: 'محرك الماكروز' }];
    if (path.includes('/master-settings')) return [{ label: 'الإعدادات' }, { label: 'إعدادات النظام' }];
    return [{ label: 'الرئيسية' }, { label: 'لوحة التحكم' }];
  };

  const breadcrumbs = getBreadcrumbs();

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header 
      style={{
        height: '42px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        direction: 'rtl',
        boxSizing: 'border-box'
      }}
    >
      {/* Breadcrumb on right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {isLast ? (
                <strong style={{ color: '#0F172A', fontWeight: 800 }}>{crumb.label}</strong>
              ) : (
                <>
                  <span style={{ cursor: 'pointer', color: '#64748B' }} onClick={() => navigate('/')}>
                    {crumb.label}
                  </span>
                  <span style={{ color: '#94A3B8' }}>›</span>
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Center / Left Toolbar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Quick Search Trigger */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '5px',
            padding: '0 8px',
            height: '28px',
            width: '210px',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Search size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11.5px', color: '#94A3B8', flex: 1, whiteSpace: 'nowrap' }}>ابحث في أي مكان...</span>
          <kbd style={{ fontSize: '9.5px', background: '#E2E8F0', color: '#475569', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace', flexShrink: 0 }}>
            Ctrl /
          </kbd>
        </div>

        {/* Refresh Button */}
        <button 
          type="button"
          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', cursor: 'pointer' }}
          title="تحديث البيانات"
          onClick={handleRefresh}
        >
          <RotateCw size={13} color="#475569" />
        </button>

        {/* Fullscreen Button */}
        <button 
          type="button"
          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', cursor: 'pointer' }}
          title="ملء الشاشة"
          onClick={toggleFullScreen}
        >
          <Maximize2 size={13} color="#475569" />
        </button>

        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* Interactive Coach Profile Dropdown */}
        <CoachAccountDropdown />

      </div>
    </header>
  );
}

export default AdminHeader;
