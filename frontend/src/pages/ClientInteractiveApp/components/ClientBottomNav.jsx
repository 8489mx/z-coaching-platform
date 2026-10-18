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
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '390px',
        height: '52px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        borderRadius: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '2px 6px',
        zIndex: 40,
        boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04)'
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const TabIcon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            aria-label={tab.label}
            onClick={() => onSwitchTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '14px',
                background: isActive ? '#58B4E5' : 'transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: isActive ? '0 6px 14px -2px rgba(88, 180, 229, 0.35)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <TabIcon style={{ width: '19px', height: '19px', strokeWidth: isActive ? 2.3 : 1.8 }} />
            </div>
          </button>
        );
      })}
    </nav>
  );
}
