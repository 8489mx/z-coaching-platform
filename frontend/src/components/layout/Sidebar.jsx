import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  LogOut,
  X
} from 'lucide-react';

const iconToneMap = {
  dashboard: { bg: 'linear-gradient(135deg, #ede9fe, #dbeafe)', border: '#c4b5fd', fg: '#5b21b6', glow: 'rgba(99, 102, 241, 0.22)' },
  intakes: { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', border: '#86efac', fg: '#166534', glow: 'rgba(34, 197, 94, 0.22)' },
  checkins: { bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', border: '#93c5fd', fg: '#1d4ed8', glow: 'rgba(37, 99, 235, 0.22)' },
  customers: { bg: 'linear-gradient(135deg, #ffe4e6, #fecdd3)', border: '#fda4af', fg: '#be123c', glow: 'rgba(244, 63, 94, 0.2)' },
  subscriptions: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '#fbbf24', fg: '#a16207', glow: 'rgba(245, 158, 11, 0.24)' },
  exercises: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', border: '#6ee7b7', fg: '#065f46', glow: 'rgba(16, 185, 129, 0.22)' },
  calculator: { bg: 'linear-gradient(135deg, #cffafe, #a5f3fc)', border: '#67e8f9', fg: '#0f766e', glow: 'rgba(6, 182, 212, 0.22)' },
  editor: { bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', border: '#c4b5fd', fg: '#6d28d9', glow: 'rgba(124, 58, 237, 0.22)' },
  analytics: { bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', border: '#a5b4fc', fg: '#4338ca', glow: 'rgba(99, 102, 241, 0.2)' },
  settings: { bg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '#cbd5e1', fg: '#475569', glow: 'rgba(71, 85, 105, 0.18)' },
  'test-engine': { bg: 'linear-gradient(135deg, #fee2e2, #fecaca)', border: '#fca5a5', fg: '#991b1b', glow: 'rgba(239, 68, 68, 0.2)' },
};

const NAVIGATION_GROUPS = [
  {
    key: 'operations',
    title: 'المتابعة والعمليات',
    iconKey: 'dashboard',
    items: [
      { key: 'dashboard', label: 'لوحة التحكم اليومية', to: '/', end: true, icon: LayoutDashboard },
      { key: 'intakes', label: 'الاستبيانات الجديدة', to: '/intake/submissions', icon: ClipboardList, badge: 'جديد' },
      { key: 'checkins', label: 'مراجعة التقييمات الأسبوعية', to: '/coach/checkin-review', icon: CheckCircle2 },
    ],
  },
  {
    key: 'clients-group',
    title: 'المشتركين والاشتراكات',
    iconKey: 'customers',
    items: [
      { key: 'customers', label: 'إدارة المشتركين (CRM)', to: '/customers', icon: Users },
      { key: 'subscriptions', label: 'الباقات والاشتراكات', to: '/subscriptions', icon: CreditCard },
    ],
  },
  {
    key: 'engines-group',
    title: 'المحركات والبرامج',
    iconKey: 'exercises',
    items: [
      { key: 'exercises', label: 'مكتبة التمارين والأمان', to: '/exercises', icon: Dumbbell },
      { key: 'calculator', label: 'محرك التغذية والماكروز', to: '/calculator', icon: UtensilsCrossed },
      { key: 'editor', label: 'منشئ ومعدل البرامج', to: '/coach/editor', icon: FileEdit },
    ],
  },
  {
    key: 'system-group',
    title: 'الإدارة والنظام',
    iconKey: 'settings',
    items: [
      { key: 'analytics', label: 'التقارير والإحصائيات', to: '/coach/analytics', icon: LineChart },
      { key: 'settings', label: 'إعدادات النظام العامة', to: '/master-settings', icon: Settings },
      { key: 'test-engine', label: 'اختبار المحرك السريري', to: '/test-engine', icon: ShieldCheck },
    ],
  },
];

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);

  const handleOpenSearch = () => {
    if (isCollapsed && onToggleSidebar) {
      onToggleSidebar();
    }
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    handleCloseSearch();
  }, [location.pathname]);

  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!cleanQuery) return NAVIGATION_GROUPS;

    return NAVIGATION_GROUPS.map((group) => {
      const matchingItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(cleanQuery) ||
          group.title.toLowerCase().includes(cleanQuery)
      );
      if (matchingItems.length === 0) return null;
      return {
        ...group,
        items: matchingItems,
      };
    }).filter(Boolean);
  }, [cleanQuery]);

  const renderItem = (item) => {
    const tone = iconToneMap[item.key] || iconToneMap.settings;
    const toneStyle = {
      '--icon-bg': tone.bg,
      '--icon-border': tone.border,
      '--icon-fg': tone.fg,
      '--icon-glow': tone.glow,
    };
    const Icon = item.icon;

    return (
      <NavLink
        key={item.key}
        to={item.to}
        end={item.end}
        style={toneStyle}
        data-tooltip={isCollapsed ? item.label : undefined}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'active' : ''}`.trim()
        }
      >
        <span className="sidebar-icon">
          <Icon size={17} style={{ strokeWidth: 2 }} />
        </span>
        <span className="sidebar-label">{item.label}</span>
        {item.badge && !isCollapsed && (
          <span
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '20px',
              marginInlineStart: 'auto',
              lineHeight: 1,
            }}
          >
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar-fixed ${isCollapsed ? 'is-collapsed' : ''}`}
      style={{
        width: isCollapsed ? '72px' : '240px',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Brand Header */}
      <div className="brand" style={{ padding: isCollapsed ? '16px 8px' : '20px 16px 14px' }}>
        <div className="brand-copy">
          {!isCollapsed ? (
            <>
              <div className="brand-title" style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>
                Z-COACHING
              </div>
              <div className="brand-sub" style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                Powered by Karim Zakaria
              </div>
            </>
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #170c5c 0%, #10003b 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '18px',
              }}
            >
              Z
            </div>
          )}
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="sidebar-search-wrapper">
        <div
          className={`sidebar-search-pill ${isSearchOpen ? 'is-expanded' : ''}`}
          onClick={() => {
            if (!isSearchOpen) handleOpenSearch();
          }}
        >
          <button
            type="button"
            className="sidebar-search-icon-btn"
            title={isSearchOpen ? 'بحث' : 'بحث سريع في القوائم'}
            onClick={(e) => {
              if (!isSearchOpen) {
                e.stopPropagation();
                handleOpenSearch();
              }
            }}
          >
            <Search size={15} />
          </button>
          {isSearchOpen && (
            <>
              <input
                ref={searchInputRef}
                type="text"
                className="sidebar-search-input"
                placeholder="ابحث في القوائم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCloseSearch();
                  }
                }}
              />
              <button
                type="button"
                className="sidebar-search-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseSearch();
                }}
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {filteredGroups.map((group) => {
          const groupTone = iconToneMap[group.iconKey] || iconToneMap.settings;
          const groupToneStyle = {
            '--icon-bg': groupTone.bg,
            '--icon-border': groupTone.border,
            '--icon-fg': groupTone.fg,
            '--icon-glow': groupTone.glow,
          };

          return (
            <div key={group.key} className="sidebar-group is-open">
              {!isCollapsed && (
                <div className="sidebar-group-trigger" style={groupToneStyle}>
                  <span className="sidebar-label" style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                    {group.title}
                  </span>
                </div>
              )}
              <div className="sidebar-group-items">
                {group.items.map(renderItem)}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer / Toggle & Account */}
      <div className="sidebar-footer" style={{ padding: '12px 14px', borderTop: '1px solid #E2E8F0' }}>
        {!isCollapsed && (
          <div className="sidebar-footer-info" style={{ marginBottom: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>الكوتش كريم زكريا</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>الإصدار v2.5 ● نظام مفعل</div>
          </div>
        )}
        <div className="sidebar-footer-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: '8px' }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="sidebar-toggle-btn"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
