import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ 
  children, 
  onOpenNewClient,
  fullWidth = true
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
    >
      {/* 1. Fixed Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* 2. Main Column */}
      <div className="main-col">
        {/* Global Toolbar Header */}
        <AdminHeader onOpenNewClient={onOpenNewClient} />

        {/* Scrollable Content View */}
        <div className="content-wrap">
          <main className="page-stack" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '20px 24px 60px 24px', boxSizing: 'border-box' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
