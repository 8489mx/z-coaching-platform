import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCw, Bell, Maximize2, Minimize2 } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';

export function AdminHeader({ 
  onOpenNewClient
}) {
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
    <div className="purchase-prototype-workspace-toolbar">
      <div className="purchase-prototype-toolbar-inner">
        
        {/* Breadcrumb on right */}
        <div className="purchase-prototype-breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {isLast ? (
                  <strong>{crumb.label}</strong>
                ) : (
                  <>
                    <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => navigate('/')}>
                      {crumb.label}
                    </span>
                    <span>›</span>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Center / Left Toolbar Actions */}
        <div className="purchase-prototype-toolbar-actions">
          
          {/* Quick Search Trigger */}
          <div className="purchase-prototype-search-container" role="search">
            <button 
              className="purchase-prototype-search" 
              onClick={() => {}}
              aria-label="بحث شامل"
            >
              <span aria-hidden="true" style={{ fontSize: '15px' }}>⌕</span>
              <span style={{ flex: 1, textAlign: 'right', color: 'var(--muted)' }}>ابحث في أي مكان...</span>
              <div className="purchase-prototype-search-shortcut" dir="ltr">
                <kbd>Ctrl</kbd> + <kbd>/</kbd>
              </div>
            </button>
          </div>

          {/* Refresh Button */}
          <button 
            type="button"
            style={{ width: 40, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
            title="تحديث البيانات (Refresh)"
            onClick={handleRefresh}
          >
            <RotateCw size={15} color="#475569" />
          </button>

          {/* Fullscreen Button */}
          <button 
            type="button"
            style={{ width: 40, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}
            title="ملء الشاشة"
            onClick={toggleFullScreen}
          >
            <Maximize2 size={15} color="#475569" />
          </button>

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Account Avatar Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 12px 3px 6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #170c5c 0%, #10003b 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ك
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>كريم زكريا</span>
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>المدرب الرئيسي</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminHeader;
