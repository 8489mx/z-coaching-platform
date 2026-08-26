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
  ChevronDown,
  X
} from 'lucide-react';

const PRIMARY_NAV_ITEMS = [
  { key: 'dashboard', label: 'لوحة التحكم اليومية', to: '/', end: true, icon: LayoutDashboard },
  { key: 'intakes', label: 'الاستبيانات الجديدة', to: '/intake/submissions', icon: ClipboardList, badge: 'جديد' },
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
      { key: 'test-engine', label: 'اختبار المحرك السريري', to: '/test-engine', icon: ShieldCheck },
    ],
  },
];

export default function Sidebar({ isCollapsed = false, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroupKeys, setOpenGroupKeys] = useState(() => ['clients-group', 'engines-group', 'system-group']);
  const searchInputRef = useRef(null);

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

  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredPrimaryItems = useMemo(() => {
    if (!cleanQuery) return PRIMARY_NAV_ITEMS;
    return PRIMARY_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(cleanQuery));
  }, [cleanQuery]);

  const filteredGroups = useMemo(() => {
    if (!cleanQuery) return SIDEBAR_GROUPS;

    return SIDEBAR_GROUPS.map((group) => {
      const matchingItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(cleanQuery) ||
          group.label.toLowerCase().includes(cleanQuery)
      );
      if (matchingItems.length === 0) return null;
      return {
        ...group,
        items: matchingItems,
      };
    }).filter(Boolean);
  }, [cleanQuery]);

  const renderNavItem = (item, isSubItem = false) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.key}
        to={item.to}
        end={item.end}
        data-tooltip={isCollapsed ? item.label : undefined}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: isSubItem ? '8px 12px' : '9px 12px',
          borderRadius: '8px',
          textDecoration: 'none',
          color: isActive ? '#0F172A' : '#475569',
          background: isActive ? '#F1F5F9' : 'transparent',
          fontSize: isSubItem ? '12.5px' : '13px',
          fontWeight: isActive ? 800 : 600,
          transition: 'all 0.15s ease',
          marginBottom: '2px',
        })}
      >
        {({ isActive }) => (
          <>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: isActive ? '#0F172A' : (isSubItem ? 'transparent' : '#F8FAFC'),
                border: isActive ? '1px solid #0F172A' : (isSubItem ? 'none' : '1px solid #E2E8F0'),
                color: isActive ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            {!isCollapsed && (
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            )}
            {item.badge && !isCollapsed && (
              <span
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  marginInlineStart: 'auto',
                  lineHeight: 1,
                }}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '72px' : '255px',
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
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Brand Header */}
      <div 
        style={{ 
          padding: isCollapsed ? '16px 8px' : '18px 18px 14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #F1F5F9',
          gap: '12px'
        }}
      >
        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Z-COACHING
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              منظومة التدريب والمتابعة
            </div>
          </div>
        )}

        <div 
          onClick={() => navigate('/')} 
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: '#0F172A', 
            color: '#FFFFFF',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '17px',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="الرئيسية"
        >
          Z
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '10px 14px 6px' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0 10px',
            height: '34px',
            boxSizing: 'border-box'
          }}
        >
          <Search size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={isCollapsed ? '' : 'بحث سريع في القوائم...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: '0 8px',
              fontSize: '12px',
              color: '#0F172A',
              fontWeight: 500
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Primary Items */}
        {filteredPrimaryItems.map((item) => renderNavItem(item, false))}

        <div style={{ height: '8px' }} />

        {/* Grouped Accordions */}
        {filteredGroups.map((group) => {
          const isOpen = openGroupKeys.includes(group.key) || Boolean(cleanQuery);
          const GroupIcon = group.icon;

          return (
            <div key={group.key} style={{ marginBottom: '6px' }}>
              <div 
                onClick={() => toggleGroup(group.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <GroupIcon size={14} />
                </div>
                {!isCollapsed && (
                  <>
                    <span style={{ flex: 1, color: '#64748B', fontSize: '11.5px', fontWeight: 700 }}>
                      {group.label}
                    </span>
                    <span style={{ display: 'flex', color: '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                      <ChevronDown size={13} />
                    </span>
                  </>
                )}
              </div>

              {isOpen && !isCollapsed && (
                <div style={{ paddingRight: '12px', borderRight: '1.5px solid #E2E8F0', marginRight: '16px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {group.items.map((item) => renderNavItem(item, true))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Toggle & Account */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', background: '#FFFFFF' }}>
        {!isCollapsed && (
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>كابتن كريم زكريا</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', fontWeight: 600 }}>v2.5.0 ● مفعل</div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-end' }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
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
            {isCollapsed ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
