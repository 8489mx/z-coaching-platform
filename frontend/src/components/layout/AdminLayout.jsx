import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ 
  children, 
  onOpenNewClient,
  _fullWidth = true
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('zsystems_sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return false;
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('zsystems_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div 
      className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`} 
      dir="rtl"
      style={{ 
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#F8F9FA',
        fontFamily: "'Cairo', sans-serif" 
      }}
    >
      {/* 1. Fixed Sidebar across full window height (Hostinger Architecture) */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* 2. Main Column beside Sidebar */}
      <div 
        className="main-col" 
        style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: 0,
          backgroundColor: '#F8F9FA',
          overflow: 'hidden',
          fontFamily: "'Cairo', sans-serif" 
        }}
      >
        {/* Global Toolbar Header atop the workspace */}
        <AdminHeader onOpenNewClient={onOpenNewClient} />

        {/* Scrollable Content View beside sidebar, below header */}
        <div 
          className="content-wrap"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px 32px 48px 32px',
            boxSizing: 'border-box',
            backgroundColor: '#F8F9FA'
          }}
        >
          <main 
            className="page-stack" 
            style={{ 
              maxWidth: '1440px', 
              margin: '0 auto', 
              width: '100%', 
              boxSizing: 'border-box', 
              fontFamily: "'Cairo', sans-serif" 
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
