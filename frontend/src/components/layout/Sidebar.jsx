import { API_BASE } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
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

// 1. المقر الرئيسي (لوحة التحكم)
const PRIMARY_NAV_ITEMS = [
  { key: 'dashboard', label: 'لوحة التحكم', to: '/', end: true, icon: LayoutDashboard },
];

// 2. المجموعات المنظمة بدقة هندسية تمنع التشتت
const SIDEBAR_GROUPS = [
  {
    key: 'coaching-group',
    label: 'المشتركين والمتابعة اليومية',
    icon: Users,
    items: [
      // In the order of the day: what is waiting on the coach first, then the tools.
      { key: 'intakes', label: 'الاستمارات الجديدة', to: '/intake/submissions', icon: ClipboardList, badgeKey: 'intakes' },
      { key: 'checkins', label: 'مراجعة التقييمات', to: '/coach/checkin-review', icon: CheckCircle2, badgeKey: 'checkins' },
      { key: 'editor', label: 'محرر البرامج', to: '/coach/editor', icon: FileEdit },
      { key: 'customers', label: 'قائمة المشتركين', to: '/customers', icon: Users },
      { key: 'reminders', label: 'رسائل الواتساب', to: '/coach/reminders', icon: MessageSquare, badgeKey: 'reminders' },
    ],
  },
  {
    key: 'engines-group',
    label: 'المكتبات والمراجع العلمية',
    icon: Dumbbell,
    items: [
      { key: 'exercises', label: 'دليل التمارين', to: '/exercises', icon: Dumbbell },
      { key: 'mobility', label: 'المرونة والاستشفاء', to: '/coach/mobility', icon: HeartPulse },
      { key: 'calculator', label: 'الأغذية والماكروز', to: '/calculator', icon: UtensilsCrossed },
    ],
  },
  {
    key: 'financials-group',
    label: 'الإدارة والمالية',
    icon: Wallet,
    items: [
      { key: 'financials', label: 'الاشتراكات والمالية', to: '/coach/financials', icon: Wallet },
      { key: 'settings', label: 'إعدادات المنظومة', to: '/master-settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const _navigate = useNavigate();
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
    // A badge counts what is still waiting on the coach - an approved or rejected form is done, and
    // a form the client has not finished yet is not his to act on. It used to count every form ever
    // submitted, so the sidebar said ten while the page itself showed nothing pending.
    const AWAITING_COACH = ['PENDING_COACH_REVIEW', 'PAYMENT_CONFIRMED', 'DRAFT_GENERATED'];
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
        readJson(`${API_BASE}/api/v1/intake/submissions`)
      ]);
      if (cancelled) return;

      // A request that failed leaves its own badge as it was instead of dropping it to zero.
      setLiveBadges((prev) => ({
        ...prev,
        intakes: Array.isArray(inData?.submissions)
          ? inData.submissions.filter((s) => AWAITING_COACH.includes(String(s?.status || ''))).length
          : prev.intakes,
        checkins: Array.isArray(chData?.checkins) ? chData.checkins.length : prev.checkins,
        reminders: 0
      }));
    };

    fetchBadges();
    // The numbers follow the day: they refresh on their own and whenever the coach comes back to the tab.
    const timer = setInterval(fetchBadges, 60000);
    const onFocus = () => fetchBadges();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
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
            gap: isCollapsed ? '0' : '10px',
            padding: isCollapsed ? '5px 0' : (isSubItem ? '6.5px 10px' : '7.5px 10px'),
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive ? '#0F172A' : '#475569',
            background: isActive && !isCollapsed ? '#F1F5F9' : 'transparent',
            border: 'none',
            fontSize: isSubItem ? '12px' : '12.5px',
            fontWeight: isActive ? 800 : 600,
            transition: 'all 0.12s ease',
            width: '100%',
            boxSizing: 'border-box'
          })}
        >
          {({ isActive }) => (
            <>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: isActive ? '#0F172A' : '#F8FAFC',
                  border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.12s ease',
                  boxShadow: isActive ? '0 2px 5px rgba(15, 23, 42, 0.20)' : 'none',
                  position: 'relative'
                }}
              >
                <Icon 
                  size={13} 
                  strokeWidth={2.2} 
                  color={isActive ? '#FFFFFF' : '#64748B'}
                  style={{ display: 'block' }}
                />

                {/* Floating Apple-Style Notification Badge on top-right corner */}
                {item.badgeKey && liveBadges[item.badgeKey] > 0 && (
                  <span
                    className="sidebar-badge-apple"
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-6px',
                      backgroundColor: '#FF3B30',
                      background: '#FF3B30',
                      color: '#FFFFFF',
                      WebkitTextFillColor: '#FFFFFF',
                      border: 'none',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: '17px',
                      width: liveBadges[item.badgeKey] > 9 ? 'auto' : '17px',
                      height: '17px',
                      padding: liveBadges[item.badgeKey] > 9 ? '0 5px' : '0',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      boxShadow: 'none',
                      lineHeight: 1,
                      zIndex: 20,
                      pointerEvents: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        lineHeight: 1,
                        transform: 'translateY(-0.5px)',
                        color: '#FFFFFF',
                        WebkitTextFillColor: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '9.5px'
                      }}
                    >
                      {liveBadges[item.badgeKey]}
                    </span>
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="sidebar-nav-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: isSubItem ? '12px' : '12.5px' }}>
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
              borderRadius: '8px',
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
              <span style={{ background: '#FF3B30', color: '#FFFFFF', fontSize: '10px', padding: '1px 5px', borderRadius: '6px' }}>
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
          justifyContent: isCollapsed ? 'center' : 'stretch',
          padding: isCollapsed ? '0' : '0 12px',
          boxSizing: 'border-box',
          background: '#FFFFFF',
        }}
      >
        <Link
          to="/"
          className="sidebar-brand-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? '0' : '10px',
            width: '100%',
            height: '100%',
            textDecoration: 'none',
            background: 'transparent',
          }}
        >
          {/* Centered Brand Titles (Centered in the remaining space next to the badge) */}
          {!isCollapsed && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '1.2px',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  width: '100%',
                  fontFamily: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                {coachConfig?.systemName || 'Z COACHING'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#64748B',
                  lineHeight: '1.25',
                  marginTop: '2.5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  width: '100%',
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                منظومة التدريب والمتابعة
              </span>
            </div>
          )}

          {/* Logo Squircle Badge (Positioned on the Left / الشمال) */}
          <div
            style={{
              width: '34px',
              height: '34px',
              minWidth: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(145deg, #090D16 0%, #1E293B 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <path
                d="M5 6H19L5 18H19"
                stroke="url(#sidebar-z-logo-grad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="sidebar-z-logo-grad"
                  x1="5"
                  y1="6"
                  x2="19"
                  y2="18"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </Link>
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
              borderRadius: '8px',
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
