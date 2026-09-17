import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Dumbbell, Activity } from 'lucide-react';

export default function ClientBottomNav({
  activeTab,
  onSwitchTab,
  clientCode
}) {
  const navigate = useNavigate();

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
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        zIndex: 40,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)'
      }}
    >
      {[
        { key: 'meals', label: 'الوجبات', icon: Utensils },
        { key: 'workout', label: 'التمرين', icon: Dumbbell },
        { key: 'checkin', label: 'المتابعة', icon: Activity, isRoute: true }
      ].map(tab => {
        const isActive = activeTab === tab.key;
        const TabIcon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              if (tab.isRoute) {
                const rawCode = String(clientCode || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
                navigate(rawCode ? `/check-in?code=${encodeURIComponent(rawCode)}` : '/check-in');
              } else {
                onSwitchTab(tab.key);
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'transparent',
              border: 'none',
              color: isActive ? '#0284C7' : '#94A3B8',
              fontSize: '11px',
              fontWeight: isActive ? 800 : 500,
              cursor: 'pointer',
              padding: '4px 16px',
              transition: 'color 0.15s ease'
            }}
          >
            <TabIcon style={{ width: '18px', height: '18px', strokeWidth: isActive ? 2.5 : 2 }} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
