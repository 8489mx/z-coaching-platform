import { API_BASE } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  CheckCircle2,
  Users,
  Dumbbell,
  UtensilsCrossed,
  HeartPulse,
  FileEdit,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { getStoredCoachConfig } from '../../utils/themeAndCoachConfig';

// 1. الوجهات الأساسية
const PRIMARY_NAV_ITEMS = [
  { key: 'today', label: 'اليوم', to: '/', end: true, icon: CheckCircle2, badgeKey: 'actions' },
  { key: 'customers', label: 'المشتركون', to: '/customers', icon: Users },
];

// 2. المكتبة والإدارة
const SIDEBAR_GROUPS = [
  {
    key: 'library-group',
    label: 'المكتبة',
    icon: Dumbbell,
    items: [
      { key: 'exercises', label: 'دليل التمارين', to: '/exercises', icon: Dumbbell },
      { key: 'mobility', label: 'المرونة والاستشفاء', to: '/coach/mobility', icon: HeartPulse },
      { key: 'calculator', label: 'الأغذية والماكروز', to: '/calculator', icon: UtensilsCrossed },
    ],
  },
  {
    key: 'admin-group',
    label: 'الإدارة',
    icon: Settings,
    items: [
      { key: 'financials', label: 'الاشتراكات والمالية', to: '/coach/financials', icon: Wallet },
      { key: 'settings', label: 'إعدادات المنظومة', to: '/master-settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const _navigate = useNavigate();
  const location = useLocation();
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());
  const [openGroupKeys, setOpenGroupKeys] = useState(() => {
    try {
      const initial = ['library-group', 'admin-group'];
      SIDEBAR_GROUPS.forEach((group) => {
        if (group.items.some((item) => window.location.pathname === item.to || window.location.pathname.startsWith(item.to + '/'))) {
          if (!initial.includes(group.key)) initial.push(group.key);
        }
      });
      return initial;
    } catch {
      return ['library-group', 'admin-group'];
    }
  });
  const [liveBadges, setLiveBadges] = useState({ intakes: 0, checkins: 0, reminders: 0 });
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0 });

  useEffect(() => {
    let cancelled = false;

    const fetchBadges = async () => {
      const readJson = async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      const [chData, inData] = await Promise.all([
        readJson(`${API_BASE}/api/v1/programs/checkin/pending`),
        readJson(`${API_BASE}/api/v1/intake/submissions/pending`)
      ]);

      if (cancelled) return;

      const AWAITING_COACH = ['PENDING_COACH_REVIEW', 'PAYMENT_CONFIRMED', 'DRAFT_GENERATED'];

      setLiveBadges(prev => {
        const checkinsCount = Array.isArray(chData?.pending)
          ? chData.pending.length
          : (Array.isArray(chData?.checkins) ? chData.checkins.length : (Array.isArray(chData) ? chData.length : prev.checkins));
        const intakesCount = Array.isArray(inData?.submissions)
          ? inData.submissions.filter((s) => AWAITING_COACH.includes(String(s?.status || '').toUpperCase())).length
          : prev.intakes;
        const total = (Number(checkinsCount) || 0) + (Number(intakesCount) || 0);
        return {
          ...prev,
          checkins: checkinsCount,
          intakes: intakesCount,
          actions: total,
        };
      });
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Listen for coach config updates
  useEffect(() => {
    const handleStorage = () => setCoachConfig(getStoredCoachConfig());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auto expand group of active route
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

  // Render a Single Nav Link Item (Hostinger hPanel Pure White Pill & Bare Icons)
  const renderNavItem = (item, isSubItem = false) => {
    const Icon = item.icon;

    return (
      <div
        key={item.key}
        style={{ position: 'relative', width: '100%', marginBottom: '2px' }}
        onMouseEnter={(e) => handleMouseEnter(item, e)}
        onMouseLeave={handleMouseLeave}
      >
        <NavLink
          className={({ isActive }) => `hostinger-nav-item ${isActive ? 'active' : ''}`}
          to={item.to}
          end={item.end}
          target={item.target}
          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? '0' : '12px',
            padding: isCollapsed ? '8px 0' : '9px 12px',
            minHeight: '40px',
            borderRadius: '16px',
            textDecoration: 'none',
            color: isActive ? '#111827' : '#1F2937',
            background: isActive ? '#FFFFFF' : 'transparent',
            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            border: isActive ? '1px solid #E5E7EB' : '1px solid transparent',
            boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)' : 'none',
            fontSize: '14px',
            fontWeight: isActive ? 700 : 600,
            transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
            width: '100%',
            boxSizing: 'border-box'
          })}
          onMouseEnter={(e) => {
            if (!e.currentTarget.classList.contains('active')) {
              e.currentTarget.style.backgroundColor = '#EAECEF';
              e.currentTarget.style.color = '#111827';
              e.currentTarget.style.borderRadius = '16px';
              const icon = e.currentTarget.querySelector('.sidebar-item-icon');
              if (icon) {
                icon.style.stroke = '#111827';
                icon.style.color = '#111827';
                icon.style.opacity = '1';
                icon.style.visibility = 'visible';
              }
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.classList.contains('active')) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#1F2937';
              const icon = e.currentTarget.querySelector('.sidebar-item-icon');
              if (icon) {
                icon.style.stroke = '#374151';
                icon.style.color = '#374151';
                icon.style.opacity = '1';
                icon.style.visibility = 'visible';
              }
            }
          }}
        >
          {({ isActive }) => (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <Icon 
                  size={isCollapsed ? 20 : 18.5} 
                  strokeWidth={isActive ? 2.4 : 2.0} 
                  color={isActive ? '#111827' : '#374151'}
                  className="sidebar-item-icon"
                  style={{ display: 'block', flexShrink: 0, opacity: 1, visibility: 'visible' }}
                />

                {!isCollapsed && (
                  <span style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    fontSize: '14px',
                    letterSpacing: '-0.1px',
                    color: isActive ? '#111827' : '#1F2937',
                    fontWeight: isActive ? 700 : 600
                  }}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* Hostinger-style Subtle Count Pill */}
              {!isCollapsed && item.badgeKey && liveBadges[item.badgeKey] > 0 && (
                <span
                  style={{
                    backgroundColor: isActive ? '#F3F4F6' : '#E5E7EB',
                    color: isActive ? '#1F2937' : '#4B5563',
                    border: isActive ? '1px solid #E5E7EB' : '1px solid transparent',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1.5px 7px',
                    borderRadius: '6px',
                    lineHeight: 1.4,
                    flexShrink: 0
                  }}
                >
                  {liveBadges[item.badgeKey]}
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
              background: '#111827',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              zIndex: 9999,
              boxShadow: '0 4px 14px rgba(16, 24, 40, 0.2)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{item.label}</span>
            {item.badgeKey && liveBadges[item.badgeKey] > 0 && (
              <span style={{ background: '#111827', color: '#FFFFFF', fontSize: '10px', padding: '1px 5px', borderRadius: '4px' }}>
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
      className={isCollapsed ? 'sidebar-collapsed' : ''}
      style={{
        width: isCollapsed ? '64px' : '244px',
        minWidth: isCollapsed ? '64px' : '244px',
        height: '100vh',
        background: '#F4F5F7',
        borderLeft: '1px solid #EAECF0',
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
      {/* 1. Brand Bar (Hostinger hPanel Exact Alignment) */}
      <div
        style={{
          height: '60px',
          minHeight: '60px',
          borderBottom: '1px solid #EAECF0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
          boxSizing: 'border-box',
          background: '#F4F5F7',
        }}
      >
        <Link
          to="/"
          className="sidebar-brand-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCollapsed ? '0' : '12px',
            width: '100%',
            height: '100%',
            textDecoration: 'none',
            background: 'transparent',
            direction: 'ltr',
          }}
        >
          {/* Logo Mark: Karim Zakaria Custom Brand Mark */}
          <div
            style={{
              width: isCollapsed ? '34px' : '38px',
              height: isCollapsed ? '34px' : '38px',
              minWidth: isCollapsed ? '34px' : '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src="/assets/logo/logo_black.png"
              alt="Karim Zakaria Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          {!isCollapsed && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '15.5px',
                  fontWeight: 700,
                  color: '#111827',
                  letterSpacing: '0.2px',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                }}
              >
                Karim Zakaria
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#4B5563',
                  letterSpacing: '2.4px',
                  textTransform: 'uppercase',
                  lineHeight: '1.2',
                  marginTop: '2.5px',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Coaching
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 2. Navigation List (Scrollable) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '8px 6px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {/* Primary Command Center */}
        {PRIMARY_NAV_ITEMS.map((item) => renderNavItem(item, false))}

        {/* Hostinger Section Groups */}
        {SIDEBAR_GROUPS.map((group) => {
          const isOpen = openGroupKeys.includes(group.key);

          return (
            <div key={group.key} style={{ marginTop: '6px' }}>
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
                    padding: '12px 10px 5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#475467',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'color 0.12s ease',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#475467';
                  }}
                >
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475467' }}>{group.label}</span>

                  <ChevronDown
                    size={14}
                    strokeWidth={2.2}
                    style={{
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: 'transform 0.18s ease',
                      color: '#475467',
                    }}
                  />
                </button>
              ) : (
                <div style={{ height: '1px', background: '#EAECF0', margin: '6px 0' }} />
              )}

              {/* Group Items */}
              {!isCollapsed ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: isOpen ? '500px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
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

      {/* 3. Footer Bar & Collapse Action */}
      <div
        style={{
          borderTop: '1px solid #EAECF0',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4F5F7',
        }}
      >
        {/* Sidebar Collapse/Expand Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              width: '100%',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#475467',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
            }}
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            onMouseEnter={(e) => { 
              e.currentTarget.style.background = '#F9FAFB'; 
              e.currentTarget.style.borderColor = '#D0D5DD';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.background = '#FFFFFF'; 
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.color = '#475467';
            }}
          >
            {isCollapsed ? <ChevronLeft size={16} strokeWidth={2.0} /> : <ChevronRight size={16} strokeWidth={2.0} />}
          </button>
        )}
      </div>
    </aside>
  );
}
