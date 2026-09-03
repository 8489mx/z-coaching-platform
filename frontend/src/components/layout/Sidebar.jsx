import { API_BASE } from '../../config/api';
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
  HeartPulse,
  FileEdit,
  LineChart,
  Settings,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Smartphone,
  Wallet,
  X
} from 'lucide-react';
import { arabicSearchMatch } from '../../utils/searchUtils';
import { getStoredCoachConfig } from '../../utils/themeAndCoachConfig';

// 1. المقر الرئيسي (لوحة التحكم)
const PRIMARY_NAV_ITEMS = [
  { key: 'dashboard', label: 'لوحة التحكم', to: '/', end: true, icon: LayoutDashboard },
];

// 2. المجموعات المنظمة بدقة هندسية تمنع التشتت
const SIDEBAR_GROUPS = [
  {
    key: 'coaching-group',
    label: 'متابعة وتدريب المشتركين',
    icon: Users,
    items: [
      { key: 'customers', label: 'قائمة المشتركين', to: '/customers', icon: Users },
      { key: 'intakes', label: 'الاستمارات الجديدة', to: '/intake/submissions', icon: ClipboardList, badgeKey: 'intakes' },
      { key: 'editor', label: 'محرر البرامج', to: '/coach/editor', icon: FileEdit },
      { key: 'checkins', label: 'التقييمات الأسبوعية', to: '/coach/checkin-review', icon: CheckCircle2, badgeKey: 'checkins' },
      { key: 'reminders', label: 'رسائل الواتساب', to: '/coach/reminders', icon: MessageSquare, badgeKey: 'reminders' },
    ],
  },
  {
    key: 'engines-group',
    label: 'المكتبات والمراجع العلمية',
    icon: Dumbbell,
    items: [
      { key: 'exercises', label: 'دليل التمارين', to: '/exercises', icon: Dumbbell },
      { key: 'calculator', label: 'الأغذية والماكروز', to: '/calculator', icon: UtensilsCrossed },
      { key: 'mobility', label: 'المرونة والتأهيل', to: '/coach/mobility', icon: HeartPulse },
    ],
  },
  {
    key: 'financials-group',
    label: 'الاشتراكات والمالية',
    icon: Wallet,
    items: [
      { key: 'financials', label: 'الحسابات والتجديد', to: '/coach/financials', icon: Wallet },
    ],
  },
  {
    key: 'system-group',
    label: 'الإدارة والنظام',
    icon: Settings,
    items: [
      { key: 'settings', label: 'إعدادات المنظومة', to: '/master-settings', icon: Settings },
    ],
  },
];

// 3. ألوان البوردر والأيقونات المخصصة لكل عنصر بفخامة متناهية
const NAV_ITEM_THEMES = {
  // 1. مسار العمليات والمهام اليومية
  dashboard: {
    color: '#2563EB', // Royal Sapphire Blue
    bg: '#EFF6FF',
    border: '#93C5FD'
  },
  intakes: {
    color: '#0891B2', // Sky Cyan Teal
    bg: '#ECFEFF',
    border: '#67E8F9'
  },
  editor: {
    color: '#7C3AED', // Royal Violet Purple
    bg: '#F5F3FF',
    border: '#C4B5FD'
  },
  checkins: {
    color: '#059669', // Vivid Emerald Green
    bg: '#ECFDF5',
    border: '#6EE7B7'
  },
  reminders: {
    color: '#16A34A', // WhatsApp Leaf Green
    bg: '#F0FDF4',
    border: '#86EFAC'
  },
  client_app: {
    color: '#0284C7', // Electric Sky Blue
    bg: '#F0F9FF',
    border: '#7DD3FC'
  },

  // 2. المشتركين والمالية
  customers: {
    color: '#4F46E5', // Deep Indigo
    bg: '#EEF2FF',
    border: '#A5B4FC'
  },
  subscriptions: {
    color: '#D97706', // Rich Amber Gold
    bg: '#FFFBEB',
    border: '#FCD34D'
  },
  financials: {
    color: '#0D9488', // Dark Teal
    bg: '#F0FDFA',
    border: '#5EEAD4'
  },

  // 3. المكتبات والمراجع
  exercises: {
    color: '#E11D48', // Coral Ruby Rose
    bg: '#FFF1F2',
    border: '#FDA4AF'
  },
  calculator: {
    color: '#10B981', // Fresh Green Mint
    bg: '#ECFDF5',
    border: '#6EE7B7'
  },
  mobility: {
    color: '#DB2777', // Magenta Pink
    bg: '#FDF2F8',
    border: '#F472B6'
  },

  // 4. النظام
  analytics: {
    color: '#9333EA', // Vivid Purple
    bg: '#FAF5FF',
    border: '#D8B4FE'
  },
  settings: {
    color: '#475569', // Titanium Slate
    bg: '#F8FAFC',
    border: '#CBD5E1'
  }
};

const GROUP_THEMES = {
  'coaching-group': { color: '#2563EB', bg: '#EFF6FF' },
  'financials-group': { color: '#0D9488', bg: '#F0FDFA' },
  'engines-group': { color: '#E11D48', bg: '#FFF1F2' },
  'system-group': { color: '#475569', bg: '#F1F5F9' },
};

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const navigate = useNavigate();
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());
  const [openGroupKeys, setOpenGroupKeys] = useState(() => {
    try {
      const initial = ['coaching-group', 'financials-group', 'engines-group'];
      SIDEBAR_GROUPS.forEach((group) => {
        if (group.items.some((item) => window.location.pathname === item.to || window.location.pathname.startsWith(item.to + '/'))) {
          if (!initial.includes(group.key)) initial.push(group.key);
        }
      });
      return initial;
    } catch {
      return ['coaching-group', 'financials-group', 'engines-group'];
    }
  });
  const [liveBadges, setLiveBadges] = useState({ intakes: 0, checkins: 0, reminders: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [chRes, inRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/programs/checkin/pending`).catch(() => ({ json: () => ({ checkins: [] }) })),
          fetch(`${API_BASE}/api/v1/intake/submissions`).catch(() => ({ json: () => ({ submissions: [] }) }))
        ]);
        const chData = await chRes.json?.().catch(() => ({}));
        const inData = await inRes.json?.().catch(() => ({}));
        setLiveBadges({
          intakes: Array.isArray(inData?.submissions) ? inData.submissions.length : 0,
          checkins: Array.isArray(chData?.checkins) ? chData.checkins.length : 0,
          reminders: 0
        });
      } catch (e) {}
    };
    fetchBadges();
  }, []);

      const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0 });

  const location = useLocation();
  
  // Sync Coach config updates across windows
  useEffect(() => {
    const handleConfigUpdate = () => {
      setCoachConfig(getStoredCoachConfig());
    };
    window.addEventListener('coach-config-updated', handleConfigUpdate);
    window.addEventListener('storage', handleConfigUpdate);
    return () => {
      window.removeEventListener('coach-config-updated', handleConfigUpdate);
      window.removeEventListener('storage', handleConfigUpdate);
    };
  }, []);

  
  // Keep group open if an item inside is active
  useEffect(() => {
    SIDEBAR_GROUPS.forEach((group) => {
      const hasActive = group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'));
      if (hasActive) {
        setOpenGroupKeys((prev) => (prev.includes(group.key) ? prev : [...prev, group.key]));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (key) => {
    setOpenGroupKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  
  const handleMouseEnter = (item, e) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top + rect.height / 2 });
    setActiveTooltip(item);
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  // Render a Single Nav Link Item
  const renderNavItem = (item, isSubItem = false) => {
    const Icon = item.icon;
    const theme = NAV_ITEM_THEMES[item.key] || {
      color: '#334155',
      bg: '#F8FAFC',
      border: '#E2E8F0'
    };

    return (
      <div
        key={item.key}
        style={{ position: 'relative', width: '100%', marginBottom: isSubItem ? '1.5px' : '3px' }}
        onMouseEnter={(e) => handleMouseEnter(item, e)}
        onMouseLeave={handleMouseLeave}
      >
        <NavLink
          to={item.to}
          end={item.end}
          target={item.target}
          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '11px',
            padding: isCollapsed ? '4px 0' : (isSubItem ? '7px 10px' : '7.5px 10px'),
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive ? theme.color : '#334155',
            background: isActive && !isCollapsed ? theme.bg : 'transparent',
            fontSize: isSubItem ? '12.5px' : '13px',
            fontWeight: isActive ? 800 : 600,
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
                  borderRadius: '7.5px',
                  background: theme.bg || '#F8FAFC',
                  border: isActive ? `1.8px solid ${theme.color}` : `1.5px solid ${theme.border}`,
                  color: theme.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 2px 5px ${theme.color}25` : 'none',
                  position: 'relative'
                }}
              >
                <Icon 
                  size={14} 
                  strokeWidth={2.4} 
                  color={theme.color}
                  style={{ 
                    color: theme.color,
                    stroke: theme.color,
                    display: 'block'
                  }}
                />

                {/* Floating Apple Red Notification Badge on top-right corner */}
                {item.badgeKey && liveBadges[item.badgeKey] > 0 && (
                  <span
                    className="sidebar-badge-apple"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      transform: 'translate(35%, -35%)',
                      backgroundColor: '#FF3B30',
                      background: '#FF3B30',
                      color: '#FFFFFF',
                      WebkitTextFillColor: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: 900,
                      minWidth: '17px',
                      height: '17px',
                      padding: '0 4px',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Cairo, system-ui, -apple-system, sans-serif',
                      border: 'none',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                      lineHeight: 1,
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    <b style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', fontWeight: 900, fontSize: '9.5px', lineHeight: 1 }}>
                      {liveBadges[item.badgeKey]}
                    </b>
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12.5px', fontWeight: isActive ? 800 : 600 }}>
                  {item.label}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* Floating Tooltip in Collapsed Mode */}
        {isCollapsed && activeTooltip?.key === item.key && (
          <div
            style={{
              position: 'fixed',
              right: '68px',
              top: `${tooltipPos.top}px`,
              transform: 'translateY(-50%)',
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              zIndex: 9999,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{item.label}</span>
            {item.badgeKey && liveBadges[item.badgeKey] > 0 && (
              <span style={{ background: '#FF3B30', color: '#FFFFFF', fontSize: '10px', padding: '1px 5px', borderRadius: '4px' }}>
                {liveBadges[item.badgeKey]}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      dir="rtl"
      style={{
        width: isCollapsed ? '60px' : '230px',
        minWidth: isCollapsed ? '60px' : '230px',
        height: '100vh',
        background: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      {/* 1. Header / Brand Bar */}
      <div
        style={{
          height: '60px',
          minHeight: '60px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 12px',
          gap: '8px',
          boxSizing: 'border-box',
        }}
      >
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Logo Squircle Badge */}
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '-0.5px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
              fontFamily: 'Cairo, sans-serif'
            }}
          >
            Z
          </div>

          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-0.2px',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                }}
              >
                {coachConfig?.systemName || 'Z COACHING'}
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 600,
                  color: '#64748B',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                }}
              >
                منظومة التدريب والمتابعة
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* 3. Navigation List (Scrollable) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '8px 6px' : '4px 8px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {/* Primary Daily Operational Pipeline */}
        {PRIMARY_NAV_ITEMS.map((item) => renderNavItem(item, false))}

        {/* Accordion Groups */}
        {SIDEBAR_GROUPS.map((group) => {
          const isOpen = openGroupKeys.includes(group.key);
          const GroupIcon = group.icon;
          const gTheme = GROUP_THEMES[group.key] || { color: '#64748B', bg: '#F8FAFC' };

          return (
            <div key={group.key} style={{ marginTop: '8px' }}>
              {/* Group Trigger */}
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#64748B',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0F172A';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748B';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 800 }}>{group.label}</span>

                  <ChevronDown
                    size={13}
                    style={{
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: 'transform 0.2s ease',
                      color: '#94A3B8',
                    }}
                  />
                </button>
              ) : (
                <div style={{ height: '1px', background: '#F1F5F9', margin: '6px 0' }} />
              )}

              {/* Group Items (Slide Down Transition) */}
              {!isCollapsed ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    paddingRight: '8px',
                    borderRight: '1.5px solid #F1F5F9',
                    marginRight: '6px',
                    maxHeight: isOpen ? '500px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, margin-top 0.2s ease',
                    marginTop: isOpen ? '3px' : '0px',
                  }}
                >
                  {group.items.map((item) => renderNavItem(item, true))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {group.items.map((item) => renderNavItem(item, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Footer & Profile / Collapse Toggle */}
      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: '#FFFFFF',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {(coachConfig?.coachName || 'ك')[0]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#0F172A',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {coachConfig?.coachName || 'كابتن المنظومة'}
                </span>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>
                  v2.5.0 • مفعل
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Collapse/Expand Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px 0',
              borderRadius: '6px',
              border: '1px solid #F1F5F9',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
          >
            {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>
    </aside>
  );
}
