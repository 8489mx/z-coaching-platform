import React from 'react';
import { Utensils, Dumbbell, BookOpen, Activity } from 'lucide-react';

export default function ClientBottomNav({
  activeTab,
  onSwitchTab
}) {
  const tabs = [
    { key: 'meals', label: 'الوجبات', icon: Utensils },
    { key: 'workout', label: 'التمرين', icon: Dumbbell },
    { key: 'supplements', label: 'المكملات والأدلة', icon: BookOpen },
    { key: 'plan', label: 'الخطة والمتابعة', icon: Activity }
  ];

  return (
    <nav 
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '6px 4px 8px 4px',
        zIndex: 40,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)'
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const TabIcon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSwitchTab(tab.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              color: isActive ? '#0284C7' : '#94A3B8',
              fontSize: '10.5px',
              fontWeight: isActive ? 800 : 600,
              cursor: 'pointer',
              padding: '4px 2px',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <TabIcon style={{ width: '18px', height: '18px', strokeWidth: isActive ? 2.5 : 2 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
