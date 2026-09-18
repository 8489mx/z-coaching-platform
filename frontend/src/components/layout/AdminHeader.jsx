import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCw, Maximize2, Smartphone } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';
import CoachAccountDropdown from './CoachAccountDropdown';
import GlobalSearchModal from '../modals/GlobalSearchModal';

export function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();


  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return [{ label: 'الرئيسية' }, { label: 'لوحة التحكم' }];
    if (path.includes('/intake')) return [{ label: 'الاستمارات' }, { label: 'الاستمارات الجديدة' }];
    if (path.includes('/checkin')) return [{ label: 'المتابعة' }, { label: 'مراجعة التقييمات' }];
    if (path.includes('/customers')) return [{ label: 'المشتركون' }, { label: 'قائمة المشتركين' }];
    if (path.includes('/financials') || path.includes('/subscriptions')) return [{ label: 'المالية' }, { label: 'الاشتراكات والمالية' }];
    if (path.includes('/editor')) return [{ label: 'التدريب' }, { label: 'محرر البرامج' }];
    if (path.includes('/exercises')) return [{ label: 'المراجع' }, { label: 'دليل التمارين' }];
    if (path.includes('/calculator')) return [{ label: 'المراجع' }, { label: 'الأغذية والماكروز' }];
    if (path.includes('/mobility')) return [{ label: 'المراجع' }, { label: 'المرونة والاستشفاء' }];
    if (path.includes('/reminders')) return [{ label: 'المراسلات' }, { label: 'رسائل الواتساب' }];
    if (path.includes('/master-settings')) return [{ label: 'الإعدادات' }, { label: 'إعدادات المنظومة' }];
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
    <>
      <header 
        style={{
          height: '52px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          direction: 'rtl',
          boxSizing: 'border-box'
        }}
      >
        {/* Breadcrumb on right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          <GlobalSearchModal />

          {/* Client App Preview Button */}
          <button 
            type="button"
            style={{ 
              height: '32px', 
              padding: '0 10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#0F172A',
              transition: 'all 0.12s ease'
            }}
            title="معاينة تطبيق المشترك على الجوال"
            onClick={() => window.open('/client/today', '_blank')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <Smartphone size={14} color="#0284C7" />
            <span>تطبيق المشترك</span>
          </button>

          {/* Refresh Button */}
          <button 
            type="button"
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}
            title="تحديث البيانات"
            onClick={handleRefresh}
          >
            <RotateCw size={14} color="#475569" />
          </button>

          {/* Fullscreen Button */}
          <button 
            type="button"
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}
            title="ملء الشاشة"
            onClick={toggleFullScreen}
          >
            <Maximize2 size={14} color="#475569" />
          </button>

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* Interactive Coach Profile Dropdown */}
          <CoachAccountDropdown />

        </div>
      </header>

      
    </>
  );
}

export default AdminHeader;
