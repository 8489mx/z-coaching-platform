import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ActivitySquare,
  Dumbbell,
  UtensilsCrossed,
  CreditCard,
  Users,
  Smartphone,
  Settings
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    title: 'الرئيسية والمتابعة',
    items: [
      { name: 'لوحة القيادة', path: '/', aliasPath: '/dashboard', icon: LayoutDashboard },
      { name: 'استمارات المشتركين', path: '/intake/submissions', aliasPath: '/intakes', icon: ClipboardList, badge: 'جديد' },
      { name: 'مركز المتابعات', path: '/progress', aliasPath: '/check-ins', icon: ActivitySquare },
    ],
  },
  {
    title: 'البرامج والأدوات',
    items: [
      { name: 'مكتبة التمارين والأمان', path: '/exercises', aliasPath: '/workouts', icon: Dumbbell },
      { name: 'محرك التغذية والماكروز', path: '/calculator', aliasPath: '/nutrition', icon: UtensilsCrossed },
      { name: 'الاشتراكات والمالية', path: '/subscriptions', aliasPath: '/finance', icon: CreditCard },
    ],
  },
  {
    title: 'الإدارة والتحكم',
    items: [
      { name: 'إدارة المشتركين', path: '/customers', aliasPath: '/clients', icon: Users },
      { name: 'الملف الشخصي والإعدادات', path: '/profile', aliasPath: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({ currentPath, onNavigate, isCollapsed = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = currentPath || location.pathname;

  const handleItemClick = (path) => {
    if (onNavigate) onNavigate(path);
    else navigate(path);
  };

  return (
    <aside 
      className={`codex-sidebar ${isCollapsed ? 'collapsed' : ''}`} 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: isCollapsed ? '76px' : '250px',
        background: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        direction: 'rtl',
        transition: 'width 0.22s ease'
      }}
      dir="rtl"
    >
      {/* Top Brand: Coach Karim Zakaria */}
      <div 
        style={{ 
          padding: isCollapsed ? '16px 8px' : '18px 16px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div 
          style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}
        >
          KZ
        </div>
        {!isCollapsed && (
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              كابتن كريم زكريا
            </h1>
            <span 
              style={{ 
                fontSize: '9.5px', 
                fontWeight: 700, 
                color: '#0284C7', 
                background: '#E0F2FE', 
                borderRadius: '4px', 
                padding: '1px 6px',
                display: 'inline-block',
                marginTop: '2px'
              }}
            >
              Super Admin
            </span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {NAVIGATION_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} style={{ marginBottom: '14px' }}>
            {!isCollapsed && (
              <h2 
                style={{ 
                  fontSize: '10.5px', 
                  fontWeight: 700, 
                  color: '#94A3B8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.4px',
                  padding: '0 10px',
                  margin: '0 0 6px 0'
                }}
              >
                {group.title}
              </h2>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((item) => {
                const isActive = activePath === item.path || (item.aliasPath && activePath === item.aliasPath) || (item.path !== '/' && activePath.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleItemClick(item.path)}
                    title={isCollapsed ? item.name : ''}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? '#E0F2FE' : 'transparent',
                      color: isActive ? '#0284C7' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'right',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          color: isActive ? '#0284C7' : '#94A3B8',
                          flexShrink: 0
                        }} 
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          background: '#BAE6FD', 
                          color: '#0369A1', 
                          padding: '2px 7px',
                          borderRadius: '10px'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Client Mobile Simulator Button */}
      <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
        <button
          type="button"
          onClick={() => handleItemClick('/mobile')}
          title={isCollapsed ? 'محاكي تطبيق المشترك' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            height: '40px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)'
          }}
        >
          <Smartphone style={{ width: '16px', height: '16px', color: '#38BDF8', flexShrink: 0 }} />
          {!isCollapsed && <span>محاكي تطبيق المشترك</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
