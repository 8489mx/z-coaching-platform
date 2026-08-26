import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ 
  children, 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder,
  onOpenNewClient
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('z_sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('z_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div 
      className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`} 
      dir="rtl"
    >
      {/* 1. Sidebar (Fixed / Collapsible) */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* 2. Main Column */}
      <div className="main-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Global Toolbar Header */}
        <AdminHeader 
          searchTerm={searchTerm} 
          onSearchChange={onSearchChange} 
          searchPlaceholder={searchPlaceholder} 
          isCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenNewClient={onOpenNewClient}
        />

        {/* Scrollable Content View */}
        <div className="content-wrap" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 48px' }}>
          <main className="page-stack" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
