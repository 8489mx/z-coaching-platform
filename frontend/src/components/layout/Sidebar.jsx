import React, { useState, useRef, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Users,
  CreditCard,
  Dumbbell,
  UtensilsCrossed,
  FileEdit,
  LineChart,
  Settings,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { arabicSearchMatch } from '../../utils/searchUtils';
import { getStoredCoachConfig } from '../../utils/themeAndCoachConfig';

const PRIMARY_NAV_ITEMS = [
  { key: 'dashboard', label: 'لوحة التحكم اليومية', to: '/', end: true, icon: LayoutDashboard },
  { key: 'intakes', label: 'الاستبيانات الجديدة', to: '/intake/submissions', icon: ClipboardList },
  { key: 'checkins', label: 'مراجعة التقييمات', to: '/coach/checkin-review', icon: CheckCircle2 },
];

const SIDEBAR_GROUPS = [
  {
    key: 'clients-group',
    label: 'المشتركين والاشتراكات',
    icon: Users,
    items: [
      { key: 'customers', label: 'إدارة المشتركين (CRM)', to: '/customers', icon: Users },
      { key: 'subscriptions', label: 'الباقات والاشتراكات', to: '/subscriptions', icon: CreditCard },
    ],
  },
  {
    key: 'engines-group',
    label: 'المحركات والبرامج',
    icon: Dumbbell,
    items: [
      { key: 'exercises', label: 'مكتبة التمارين والأمان', to: '/exercises', icon: Dumbbell },
      { key: 'calculator', label: 'محرك التغذية والماكروز', to: '/calculator', icon: UtensilsCrossed },
      { key: 'editor', label: 'منشئ ومعدل البرامج', to: '/coach/editor', icon: FileEdit },
    ],
  },
  {
    key: 'system-group',
    label: 'الإدارة والنظام',
    icon: Settings,
    items: [
      { key: 'analytics', label: 'التقارير والإحصائيات', to: '/coach/analytics', icon: LineChart },
      { key: 'settings', label: 'إعدادات النظام العامة', to: '/master-settings', icon: Settings },
    ],
  },
];

const NAV_ITEM_THEMES = {
  // 1. لوحة التحكم والعمليات اليومية
  dashboard: {
    color: '#4F46E5', // Indigo Blue
    bg: '#EEF2FF',
    border: '#C7D2FE',
    hoverBg: '#E0E7FF'
  },
  intakes: {
    color: '#0891B2', // Cyan / Sky Teal
    bg: '#ECFEFF',
    border: '#A5F3FC',
    hoverBg: '#CFFAFE'
  },
  checkins: {
    color: '#059669', // Emerald Green
    bg: '#ECFDF5',
    border: '#A7F3D0',
    hoverBg: '#D1FAE5'
  },

  // 2. المشتركين والمالية
  customers: {
    color: '#7C3AED', // Purple / Violet
    bg: '#F5F3FF',
    border: '#DDD6FE',
    hoverBg: '#EDE9FE'
  },
  subscriptions: {
    color: '#D97706', // Amber Gold
    bg: '#FFFBEB',
    border: '#FDE68A',
    hoverBg: '#FEF3C7'
  },

  // 3. المحركات والبرامج
  exercises: {
    color: '#E11D48', // Coral Rose
    bg: '#FFF1F2',
    border: '#FECDD3',
    hoverBg: '#FFE4E6'
  },
  calculator: {
    color: '#10B981', // Fresh Mint Green
    bg: '#ECFDF5',
    border: '#A7F3D0',
    hoverBg: '#D1FAE5'
  },
  editor: {
    color: '#2563EB', // Royal Electric Blue
    bg: '#EFF6FF',
    border: '#BFDBFE',
    hoverBg: '#DBEAFE'
  },

  // 4. الإدارة والنظام
  analytics: {
    color: '#9333EA', // Deep Purple
    bg: '#FAF5FF',
    border: '#E9D5FF',
    hoverBg: '#F3E8FF'
  },
  settings: {
    color: '#475569', // Titanium Slate
    bg: '#F1F5F9',
    border: '#CBD5E1',
    hoverBg: '#E2E8F0'
  }
};

const GROUP_THEMES = {
  'clients-group': { color: '#7C3AED', bg: '#F5F3FF' },
  'engines-group': { color: '#2563EB', bg: '#EFF6FF' },
  'system-group': { color: '#475569', bg: '#F1F5F9' },
};

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const navigate = useNavigate();
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());
  const [openGroupKeys, setOpenGroupKeys] = useState(() => ['clients-group', 'engines-group', 'system-group']);

  useEffect(() => {
    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setCoachConfig(e.detail);
      }
    };
    window.addEventListener('z-coach-config-updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('z-coach-config-updated', handleConfigUpdate);
    };
  }, []);

  const toggleGroup = (groupKey) => {
    if (isCollapsed && onToggleSidebar) {
      onToggleSidebar();
      setOpenGroupKeys((prev) => (prev.includes(groupKey) ? prev : [...prev, groupKey]));
      return;
    }
    setOpenGroupKeys((prev) =>
      prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey]
    );
  };

  const renderNavItem = (item, isSubItem = false) => {
    const Icon = item.icon;
    const theme = NAV_ITEM_THEMES[item.key] || {
      color: '#4F46E5',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      hoverBg: '#E0E7FF'
    };

    return (
      <div key={item.key} className={isCollapsed ? 'sidebar-item-wrap' : undefined} style={{ width: '100%' }}>
        <NavLink
          to={item.to}
          end={item.end}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '11px',
            padding: isCollapsed ? '4px 0' : (isSubItem ? '7px 10px' : '8px 10px'),
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive ? theme.color : '#334155',
            background: isActive && !isCollapsed ? theme.bg : 'transparent',
            fontSize: isSubItem ? '12.5px' : '13px',
            fontWeight: isActive ? 750 : 600,
            transition: 'all 0.15s ease',
            width: '100%',
            boxSizing: 'border-box'
          })}
        >
          {({ isActive }) => (
            <>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: isActive ? theme.color : theme.bg,
                  border: isActive ? `1px solid ${theme.color}` : `1px solid ${theme.border}`,
                  color: isActive ? '#FFFFFF' : theme.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? `0 2px 6px ${theme.color}35` : '0 1px 2px rgba(0, 0, 0, 0.02)'
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.2 : 1.9} />
              </div>
              {!isCollapsed && (
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* Floating Tooltip in Collapsed Mode */}
        {isCollapsed && (
          <div className="sidebar-flyout-tooltip">
            <span>{item.label}</span>
            {item.badge && (
              <span style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '1px 5px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 800 }}>
                {item.badge}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '255px',
        background: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: isCollapsed ? 'visible' : 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Brand Header */}
      <div 
        style={{ 
          padding: isCollapsed ? '12px 0' : '14px 18px', 
          height: '52px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #F1F5F9',
          boxSizing: 'border-box',
          flexShrink: 0,
          overflow: isCollapsed ? 'visible' : 'hidden'
        }}
      >
        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: coachConfig?.primaryColor || 'var(--primary, #0F172A)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              {coachConfig?.brandTitle || 'Z-COACHING'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              منظومة التدريب والمتابعة
            </div>
          </div>
        )}

        <div className={isCollapsed ? 'sidebar-item-wrap' : undefined} style={{ width: isCollapsed ? 'auto' : undefined }}>
          <div 
            onClick={() => navigate('/')} 
            style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '8px', 
              background: coachConfig?.primaryColor || 'var(--primary, #0F172A)', 
              color: '#FFFFFF',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '16px',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)'
            }}
          >
            {(coachConfig?.brandTitle || 'Z').charAt(0).toUpperCase()}
          </div>
          {isCollapsed && (
            <div className="sidebar-flyout-tooltip">
              <span>الرئيسية (لوحة التحكم)</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List - Zero Horizontal Overflow */}
      <nav 
        style={{ 
          flex: 1, 
          overflowY: isCollapsed ? 'visible' : 'auto', 
          overflowX: isCollapsed ? 'visible' : 'hidden',
          padding: isCollapsed ? '10px 0' : '10px 12px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: isCollapsed ? 'center' : 'stretch',
          gap: '5px'
        }}
      >
        {/* Primary Items */}
        {PRIMARY_NAV_ITEMS.map((item) => renderNavItem(item, false))}

        {/* Grouped Accordions */}
        {SIDEBAR_GROUPS.map((group) => {
          const isOpen = openGroupKeys.includes(group.key);
          const GroupIcon = group.icon;

          if (isCollapsed) {
            // When collapsed, render group items directly with a subtle divider
            return (
              <React.Fragment key={group.key}>
                <div style={{ width: '28px', height: '1px', background: '#E2E8F0', margin: '6px 0' }} />
                {group.items.map((item) => renderNavItem(item, false))}
              </React.Fragment>
            );
          }

          return (
            <div key={group.key} style={{ marginTop: '6px', marginBottom: '4px', width: '100%', boxSizing: 'border-box' }}>
              <div 
                onClick={() => toggleGroup(group.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '5px', 
                  background: (GROUP_THEMES[group.key] || { bg: '#F8FAFC' }).bg, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: (GROUP_THEMES[group.key] || { color: '#64748B' }).color,
                  flexShrink: 0
                }}>
                  <GroupIcon size={12} strokeWidth={2.2} />
                </div>
                <span style={{ flex: 1, color: '#475569', fontSize: '11.5px', fontWeight: 800 }}>
                  {group.label}
                </span>
                <span style={{ display: 'flex', color: '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <ChevronDown size={13} />
                </span>
              </div>

              {isOpen && (
                <div style={{ paddingRight: '12px', borderRight: '1.5px solid #E2E8F0', marginRight: '14px', marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.items.map((item) => renderNavItem(item, true))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Toggle Button */}
      <div 
        style={{ 
          padding: isCollapsed ? '10px 0' : '10px 14px', 
          borderTop: '1px solid #F1F5F9', 
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: isCollapsed ? 'visible' : 'hidden'
        }}
      >
        {!isCollapsed && (
          <div style={{ marginBottom: '8px', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>
              {coachConfig?.coachName || 'Karim Zakaria'}
            </div>
            <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '1px', fontWeight: 600 }}>v2.5.0 ● مفعل</div>
          </div>
        )}
        <div className={isCollapsed ? 'sidebar-item-wrap' : undefined}>
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.15s ease'
            }}
          >
            {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          {isCollapsed && (
            <div className="sidebar-flyout-tooltip">
              <span>توسيع القائمة الجانبية</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
