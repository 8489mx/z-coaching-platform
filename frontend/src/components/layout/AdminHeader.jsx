import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Home, ChevronLeft, Plus } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';
import CoachAccountDropdown from './CoachAccountDropdown';
import GlobalSearchModal from '../modals/GlobalSearchModal';

export function AdminHeader({ onOpenNewClient }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return [{ label: 'اليوم' }];
    if (path.includes('/intake')) return [{ label: 'الاستمارات الجديدة' }];
    if (path.includes('/checkin')) return [{ label: 'مراجعة التقييمات' }];
    if (path.includes('/customers')) return [{ label: 'المشتركون' }];
    if (path.includes('/reminders')) return [{ label: 'رسائل الواتساب' }];
    if (path.includes('/financials') || path.includes('/subscriptions')) return [{ label: 'الإدارة', to: '/coach/financials' }, { label: 'الاشتراكات والمالية' }];
    if (path.includes('/editor')) return [{ label: 'المشتركون', to: '/customers' }, { label: 'محرر البرامج' }];
    if (path.includes('/exercises')) return [{ label: 'المكتبة', to: '/exercises' }, { label: 'دليل التمارين' }];
    if (path.includes('/calculator')) return [{ label: 'المكتبة', to: '/calculator' }, { label: 'الأغذية والماكروز' }];
    if (path.includes('/mobility')) return [{ label: 'المكتبة', to: '/coach/mobility' }, { label: 'المرونة والاستشفاء' }];
    if (path.includes('/master-settings')) return [{ label: 'الإدارة', to: '/master-settings' }, { label: 'إعدادات المنظومة' }];
    return [{ label: 'اليوم' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header 
      style={{
        height: '60px',
        minHeight: '60px',
        background: '#FFFFFF',
        borderBottom: '1px solid #EAECF0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        direction: 'rtl',
        boxSizing: 'border-box',
        zIndex: 40
      }}
    >
      {/* Breadcrumb on right (Hostinger hPanel Breadcrumb Pattern) */}
      <nav aria-label="مسار التصفح" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#667085',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s ease'
          }}
          title="الرئيسية"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#673DE6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#667085'; }}
        >
          <Home size={15} />
        </button>

        <ChevronLeft size={13} color="#98A2B3" />

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {isLast ? (
                <span style={{ color: '#111827', fontWeight: 600 }}>{crumb.label}</span>
              ) : (
                <>
                  <span 
                    style={{ cursor: 'pointer', color: '#667085', fontWeight: 500, transition: 'color 0.15s ease' }} 
                    onClick={() => crumb.to ? navigate(crumb.to) : navigate('/')}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#667085'; }}
                  >
                    {crumb.label}
                  </span>
                  <ChevronLeft size={13} color="#98A2B3" />
                </>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Center / Left Toolbar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Hostinger Global Search Modal Button */}
        <GlobalSearchModal />

        {/* Client App Preview Button (Hostinger Secondary Button) */}
        <button 
          type="button"
          style={{ 
            height: '34px', 
            padding: '0 12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #D0D5DD', 
            borderRadius: '9999px', 
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            color: '#344054',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
            boxSizing: 'border-box'
          }}
          title="معاينة تطبيق المتدرب على الموبايل"
          onClick={() => window.open('/mobile_app_preview.html', '_blank')}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = '#F9FAFB'; 
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = '#FFFFFF'; 
            e.currentTarget.style.borderColor = '#D0D5DD';
          }}
        >
          <Smartphone size={14} color="#374151" />
          <span>تطبيق المتدرب</span>
        </button>

        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* Interactive Coach Profile Dropdown */}
        <CoachAccountDropdown />

        {/* Single Primary Purple Action (Hostinger Primary Button) */}
        {onOpenNewClient && (
          <button
            type="button"
            onClick={onOpenNewClient}
            style={{
              height: '34px',
              padding: '0 16px',
              backgroundColor: '#673DE6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5025D1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#673DE6'; }}
          >
            <Plus size={14} />
            <span>مشترك جديد</span>
          </button>
        )}

      </div>
    </header>
  );
}

export default AdminHeader;
