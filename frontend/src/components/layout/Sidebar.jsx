import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Users,
  Dumbbell,
  UtensilsCrossed,
  LineChart,
  Settings,
  ShieldCheck
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    title: 'الرئيسية والمتابعة',
    items: [
      { name: 'لوحة التحكم', path: '/', aliasPath: '/dashboard', icon: LayoutDashboard },
      { name: 'الاستبيانات الجديدة', path: '/intake/submissions', aliasPath: '/intakes', icon: ClipboardList, badge: 'جديد' },
      { name: 'مراجعة التقييمات', path: '/coach/checkin-review', aliasPath: '/checkin-review', icon: CheckCircle2 },
    ],
  },
  {
    title: 'البرامج والأدوات',
    items: [
      { name: 'إدارة العملاء (CRM)', path: '/customers', aliasPath: '/clients', icon: Users },
      { name: 'مكتبة التمارين والأمان', path: '/exercises', aliasPath: '/workouts', icon: Dumbbell },
      { name: 'محرك التغذية والماكروز', path: '/calculator', aliasPath: '/nutrition', icon: UtensilsCrossed },
    ],
  },
  {
    title: 'الإدارة والتحكم',
    items: [
      { name: 'الإحصائيات المالية', path: '/coach/analytics', aliasPath: '/analytics', icon: LineChart },
      { name: 'إعدادات النظام', path: '/master-settings', aliasPath: '/settings', icon: Settings },
      { name: 'اختبار المحرك السريري', path: '/test-engine', aliasPath: '/test', icon: ShieldCheck },
    ],
  },
];

export default function Sidebar({ currentPath, onNavigate, isCollapsed = false }) {
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
        borderLeft: '1px solid #E7EEF3',
        zIndex: 100,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div 
        className="sidebar-header" 
        style={{
          padding: isCollapsed ? '24px 0' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #E7EEF3',
          background: '#FAFBFC'
        }}
      >
        {!isCollapsed ? (
          <div className="d-flex align-items-center">
            <h4 style={{ margin: 0, fontWeight: 900, color: '#0F172A', fontSize: '18px', letterSpacing: '-0.5px' }}>
              Z-COACHING
            </h4>
          </div>
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '16px'
          }}>
            Z
          </div>
        )}
      </div>

      <div 
        className="sidebar-content" 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: '16px 0',
        }}
      >
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '24px' }}>
            {!isCollapsed && (
              <div 
                style={{ 
                  padding: '0 20px', 
                  marginBottom: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {group.title}
              </div>
            )}
            
            <nav style={{ padding: isCollapsed ? '0 8px' : '0 12px' }}>
              {group.items.map((item, iIdx) => {
                const isActive = activePath === item.path || activePath === item.aliasPath || (item.path !== '/' && activePath.startsWith(item.path));
                const Icon = item.icon;
                
                return (
                  <div
                    key={iIdx}
                    onClick={() => handleItemClick(item.path)}
                    title={isCollapsed ? item.name : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: isCollapsed ? '12px' : '10px 12px',
                      marginBottom: '4px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isActive ? '#E5F0FF' : 'transparent',
                      color: isActive ? '#0284C7' : '#475569',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#F8FAFC';
                        e.currentTarget.style.color = '#0F172A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#475569';
                      }
                    }}
                  >
                    <Icon size={isCollapsed ? 22 : 18} style={{ strokeWidth: isActive ? 2.5 : 2, flexShrink: 0 }} />
                    
                    {!isCollapsed && (
                      <span style={{ 
                        marginRight: '12px', 
                        fontSize: '13.5px', 
                        fontWeight: isActive ? 700 : 600,
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {item.name}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span style={{
                        background: '#10B981',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '20px',
                        lineHeight: 1
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
